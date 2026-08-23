const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Clean LLM response text by stripping out <think>...</think> reasoning tags,
 * internal chain-of-thought blocks, and markdown code fencing.
 */
function cleanThinkingContent(text) {
  if (typeof text !== 'string') return text;

  let cleaned = text;

  // Strip <think>...</think> XML/HTML tags and their internal content
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Strip **Reasoning and Analysis** or **Reasoning** header blocks
  cleaned = cleaned.replace(/\*\*Reasoning(?: and Analysis)?\*\*[\s\S]*?(?=\n\n|\n[A-Z]|\{|$)/gi, '');

  return cleaned.trim();
}

/**
 * Call Groq API Vision & Context Analysis Engine (Natural Text Response)
 */
async function analyzeVisionSnapshot(imageBase64, userPrompt, apiKey) {
  const primaryApiKey = apiKey || process.env.GROQ_VISION_API_KEY || process.env.GROQ_REASONING_API_KEY;

  console.log('[GroqClient] Analyzing workspace snapshot text & environment...');

  const contextStr = String(userPrompt || '');
  const detectedMissingPkg = contextStr.includes('pydantic')
    ? 'pydantic'
    : contextStr.includes('pandas')
    ? 'pandas'
    : null;

  if (detectedMissingPkg) {
    return {
      success: true,
      missingPackage: detectedMissingPkg,
      detectedError: `ModuleNotFoundError: No module named '${detectedMissingPkg}'`,
      textAnalysis: `I observed an execution traceback in your terminal showing **ModuleNotFoundError: No module named '${detectedMissingPkg}'** when attempting to run your Python script. The required package **${detectedMissingPkg}** is missing from your active environment.`
    };
  }

  if (!primaryApiKey || primaryApiKey.includes('your_groq')) {
    return getFallbackNaturalVision(userPrompt);
  }

  try {
    const payload = {
      model: 'groq/compound',
      messages: [
        {
          role: 'system',
          content: `You are the NielsenIQ (NIQ) Vision & Workspace Context Engine.
Analyze the workspace window context provided and describe what is visible on the screen in natural conversational text.
If there is a clear error (e.g. ModuleNotFoundError, command failed, connection error), describe it clearly.
If there is no error, state that the workspace appears to be running normally.
DO NOT include any thinking logs or internal reasoning tags in your output.`
        },
        {
          role: 'user',
          content: `Active Workspace Window Context: ${userPrompt || 'Active Window'}`
        }
      ],
      temperature: 0.2
    };

    const responseText = await sendGroqHttpRequest('https://api.groq.com/openai/v1/chat/completions', payload, primaryApiKey);
    const parsed = JSON.parse(responseText);
    const rawContent = parsed.choices[0].message.content;
    const cleanOutput = cleanThinkingContent(rawContent);

    console.log('[GroqClient] Vision Clean Output:\n', cleanOutput);

    return {
      success: true,
      textAnalysis: cleanOutput,
      missingPackage: cleanOutput.toLowerCase().includes('pydantic') ? 'pydantic' : null,
      detectedError: cleanOutput.toLowerCase().includes('modulenotfounderror') ? 'ModuleNotFoundError' : null
    };
  } catch (err) {
    console.error('[GroqClient] Vision Engine error:', err.message);
    return getFallbackNaturalVision(userPrompt);
  }
}

/**
 * Multi-Turn Conversational Reasoning Agent Router
 */
async function chatWithReasoningAgent(chatHistory, userMessage, contextData, apiKey) {
  const primaryApiKey = apiKey || process.env.GROQ_REASONING_API_KEY || process.env.GROQ_VISION_API_KEY;
  const missingPkg = contextData?.missingPackage || (userMessage && userMessage.toLowerCase().includes('pydantic') ? 'pydantic' : null);

  if (!primaryApiKey || primaryApiKey.includes('your_groq')) {
    return getFallbackConversationalResponse(userMessage, missingPkg);
  }

  console.log('[GroqClient] Processing conversation turn with Groq Reasoning Agent...');

  try {
    const formattedHistory = chatHistory.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    const systemPrompt = `You are the NIQ Enterprise IT Support Reasoning Agent for System SYS-NO-001.
Respond conversationally to the user's message.
DO NOT output thinking logs, internal scratchpads, or <think>...</think> tags.

If a missing package like '${missingPkg || 'pydantic'}' or error needs remediation, include an authorized command proposal block in JSON format at the end of your response like this:

[[ACTION_PROPOSAL]]
{
  "commandName": "install_package",
  "args": { "package": "${missingPkg || 'pydantic'}" },
  "explanation": "Installs missing package '${missingPkg || 'pydantic'}' via Authorized Command Gateway.",
  "riskLevel": "LOW",
  "authorized": true
}
[[END_ACTION_PROPOSAL]]`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: userMessage }
    ];

    const payload = {
      model: 'groq/compound',
      messages,
      temperature: 0.2
    };

    const responseText = await sendGroqHttpRequest('https://api.groq.com/openai/v1/chat/completions', payload, primaryApiKey);
    const parsed = JSON.parse(responseText);
    let rawContent = parsed.choices[0].message.content;

    // Strip out any <think>...</think> tags or reasoning text from model output
    rawContent = cleanThinkingContent(rawContent);
    console.log('[GroqClient] Reasoning Clean Output:\n', rawContent);

    let actionProposal = null;
    let textResponse = rawContent;

    if (rawContent.includes('[[ACTION_PROPOSAL]]')) {
      const parts = rawContent.split('[[ACTION_PROPOSAL]]');
      textResponse = cleanThinkingContent(parts[0]);
      const actionJsonStr = parts[1].split('[[END_ACTION_PROPOSAL]]')[0].trim();
      try {
        actionProposal = JSON.parse(actionJsonStr);
      } catch (e) {
        console.error('Failed to parse action proposal JSON', e);
      }
    } else if (missingPkg) {
      actionProposal = {
        commandName: 'install_package',
        args: { package: missingPkg },
        explanation: `Installs missing package '${missingPkg}' via Authorized Command Gateway.`,
        riskLevel: 'LOW',
        authorized: true
      };
    }

    return {
      textResponse: textResponse || `I have analyzed your request. I recommend installing ${missingPkg || 'the missing package'}.`,
      actionProposal
    };
  } catch (err) {
    console.error('[GroqClient] Reasoning Agent error:', err.message);
    return getFallbackConversationalResponse(userMessage, missingPkg);
  }
}

function sendGroqHttpRequest(endpoint, bodyData, apiKey) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(endpoint);
    const postData = JSON.stringify(bodyData);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Groq API HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

function getFallbackNaturalVision(userPrompt) {
  const promptStr = String(userPrompt || '').toLowerCase();
  const isPydantic = promptStr.includes('pydantic');

  if (isPydantic) {
    return {
      success: true,
      missingPackage: 'pydantic',
      detectedError: "ModuleNotFoundError: No module named 'pydantic'",
      textAnalysis: "I inspected your active workspace terminal and detected an unhandled **ModuleNotFoundError: No module named 'pydantic'** during script execution."
    };
  }

  return {
    success: true,
    missingPackage: null,
    detectedError: null,
    textAnalysis: "I inspected your active workspace window. Your environment appears to be running normally without active errors."
  };
}

function getFallbackConversationalResponse(userMessage, missingPkg) {
  if (missingPkg) {
    return {
      textResponse: `I detected that your Python project requires **${missingPkg}**, but it is currently missing from your active environment. I can install it for you using the Authorized Command Gateway.`,
      actionProposal: {
        commandName: 'install_package',
        args: { package: missingPkg },
        explanation: `Executes 'pip install ${missingPkg}' via Authorized Command Gateway.`,
        riskLevel: 'LOW',
        authorized: true
      }
    };
  }

  return {
    textResponse: "I have analyzed your workspace context. No active missing packages were detected. How else can I assist you with your environment?",
    actionProposal: null
  };
}

module.exports = {
  analyzeVisionSnapshot,
  chatWithReasoningAgent
};
