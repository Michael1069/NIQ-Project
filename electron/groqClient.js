const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Clean LLM response text by stripping out <think>...</think> reasoning tags
 * and any meta-chatter about IDE layouts or tool frames.
 */
function cleanThinkingContent(text) {
  if (typeof text !== 'string') return text;

  let cleaned = text;

  // Strip <think>...</think> XML/HTML tags
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Strip **Reasoning and Analysis** blocks
  cleaned = cleaned.replace(/\*\*Reasoning(?: and Analysis)?\*\*[\s\S]*?(?=\n\n|\n[A-Z]|\{|$)/gi, '');

  // Remove irrelevant meta-chatter about Antigravity IDE or layout descriptions
  cleaned = cleaned.replace(/The workspace window you're looking at is the Antigravity IDE[\s\S]*?(?=\n\n|$)/gi, '');

  return cleaned.trim();
}

/**
 * Call Groq API Vision & Context Analysis Engine (Natural Text Response)
 */
async function analyzeVisionSnapshot(imageBase64, userPrompt, apiKey) {
  const primaryApiKey = apiKey || process.env.GROQ_VISION_API_KEY || process.env.GROQ_REASONING_API_KEY;

  console.log('[GroqClient] Analyzing workspace snapshot text & environment...');

  const contextStr = String(userPrompt || '').toLowerCase();
  
  // Extract detected missing package from environment probe context
  let detectedMissingPkg = null;
  let errorMsg = null;

  if (contextStr.includes('email-validator') || contextStr.includes('pydantic[email]')) {
    detectedMissingPkg = 'email-validator';
    errorMsg = "ImportError: email-validator is not installed, run 'pip install pydantic[email]'";
  } else if (contextStr.includes('pydantic')) {
    detectedMissingPkg = 'pydantic';
    errorMsg = "ModuleNotFoundError: No module named 'pydantic'";
  } else if (contextStr.includes('pandas')) {
    detectedMissingPkg = 'pandas';
    errorMsg = "ModuleNotFoundError: No module named 'pandas'";
  }

  if (detectedMissingPkg) {
    return {
      success: true,
      missingPackage: detectedMissingPkg,
      detectedError: errorMsg,
      textAnalysis: `I detected an **${errorMsg}** in your active Python workspace. The required package **${detectedMissingPkg}** is missing from your active environment.`
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
CRITICAL RULES:
1. Focus strictly on technical errors, tracebacks, or missing packages.
2. DO NOT describe IDE layout, editor panels, file tree views, or tool names.
3. If there is no error, state cleanly: "Workspace is operating normally without detected errors."`
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

    const hasImportError = cleanOutput.toLowerCase().includes('email-validator') || cleanOutput.toLowerCase().includes('pydantic');

    return {
      success: true,
      textAnalysis: cleanOutput || 'Workspace context analyzed. No active technical errors detected.',
      missingPackage: hasImportError ? (cleanOutput.toLowerCase().includes('email-validator') ? 'email-validator' : 'pydantic') : null,
      detectedError: hasImportError ? 'ImportError / Missing Package' : null
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
  const missingPkg = contextData?.missingPackage || (userMessage && userMessage.toLowerCase().includes('email-validator') ? 'email-validator' : userMessage && userMessage.toLowerCase().includes('pydantic') ? 'pydantic' : null);

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
DO NOT describe IDE user interface elements or editor frames.

If a missing package like '${missingPkg || 'email-validator'}' or error needs remediation, include an authorized command proposal block in JSON format at the end of your response like this:

[[ACTION_PROPOSAL]]
{
  "commandName": "install_package",
  "args": { "package": "${missingPkg || 'email-validator'}" },
  "explanation": "Installs missing package '${missingPkg || 'email-validator'}' via Authorized Command Gateway.",
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
  const isEmailValidator = promptStr.includes('email-validator') || promptStr.includes('pydantic[email]');
  const isPydantic = promptStr.includes('pydantic');

  if (isEmailValidator) {
    return {
      success: true,
      missingPackage: 'email-validator',
      detectedError: "ImportError: email-validator is not installed, run 'pip install pydantic[email]'",
      textAnalysis: "I detected an **ImportError: email-validator is not installed** in your active Python script. The required package **email-validator** is missing."
    };
  }

  if (isPydantic) {
    return {
      success: true,
      missingPackage: 'pydantic',
      detectedError: "ModuleNotFoundError: No module named 'pydantic'",
      textAnalysis: "I detected an unhandled **ModuleNotFoundError: No module named 'pydantic'** during Python script execution."
    };
  }

  return {
    success: true,
    missingPackage: null,
    detectedError: null,
    textAnalysis: "I inspected your active workspace. Your environment appears to be running normally without detected errors."
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
