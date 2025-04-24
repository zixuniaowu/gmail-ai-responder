// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request.action);
  
  if (request.action === "generateReply") {
    // Get settings
    chrome.storage.sync.get(['apiKey', 'tone', 'language'], async function(data) {
      if (!data.apiKey) {
        console.error("API key not set");
        sendResponse({ success: false, message: "API密钥未设置，请在扩展设置中输入有效的Gemini API密钥" });
        return;
      }
      
      console.log("Retrieved settings, API key length:", data.apiKey.length);
      console.log("Using tone:", data.tone, "language:", data.language);
      console.log("Email content length:", request.emailContent.length);
      console.log("Email content sample:", request.emailContent.substring(0, 100) + "...");
      
      try {
        console.log("Calling Gemini API...");
        const response = await generateGeminiReply(
          request.emailContent, 
          data.apiKey, 
          data.tone || 'professional', 
          data.language || 'detect',
          request.originalLanguage
        );
        
        console.log("Gemini API response received successfully");
        sendResponse({ success: true, reply: response });
      } catch (error) {
        console.error("Error generating reply:", error);
        
        // Generate a fallback response when API fails
        const fallbackReply = generateFallbackReply(
          request.emailContent,
          data.tone || 'professional',
          request.originalLanguage || 'en'
        );
        
        console.log("Using fallback reply:", fallbackReply);
        
        // Return fallback reply instead of error message for better user experience
        sendResponse({ 
          success: true, 
          reply: fallbackReply
        });
      }
    });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  if (request.action === "openPopup") {
    // This is a no-op since we can't programmatically open the popup
    // But we acknowledge receipt of the message
    console.log("Received request to open popup");
    return false;
  }
});

// Generate a fallback reply when API fails
function generateFallbackReply(emailContent, tone, language) {
  console.log("Generating fallback reply in language:", language);
  
  // Extract sender name if possible
  let senderName = "";
  const nameMatch = emailContent.match(/([A-Z][a-z]+)\s+([A-Z][a-z]+)|([^\s,]+)\s+([^\s,]+)/);
  if (nameMatch) {
    senderName = nameMatch[0];
  }
  
  // Extract greeting-worthy content
  let greeting = senderName ? `${senderName}様` : "";
  
  // Simple templates for different languages
  const templates = {
    'zh': {
      'professional': `${greeting ? greeting + "，\n\n" : ""}感谢您的邮件。我已仔细阅读了您的信息，并对您提出的内容非常感兴趣。我们可以安排一次详细的讨论，以便更好地了解您的需求和探讨可能的合作机会。请告诉我您方便的时间，我会尽量配合您的日程安排。\n\n期待您的回复。\n\n此致,`,
      'friendly': `${greeting ? greeting + "，\n\n" : ""}谢谢你的邮件！看到你的来信我真的很高兴。关于你提到的事情，我觉得非常有意思，很愿意进一步交流。如果你有空，我们可以约个时间详细聊聊，或者如果你愿意的话，也可以直接通过电话沟通。\n\n期待很快听到你的回音！\n\n祝好,`,
      'concise': `${greeting ? greeting + "，\n\n" : ""}已收到您的邮件，对您提出的事项很感兴趣。建议我们安排一次会面或通话进一步讨论。请告知您的可用时间。\n\n谢谢,`,
      'detailed': `${greeting ? greeting + "，\n\n" : ""}非常感谢您发送这封邮件。我已经仔细阅读了您提供的所有信息，并且对您提出的内容非常感兴趣。基于您所述的情况，我认为我们有很好的合作空间。\n\n我想提议安排一次详细的会议，以便我们能够更深入地讨论这个项目的各个方面。在会议中，我们可以探讨您的具体需求、预期目标、时间表以及其他相关细节。\n\n请告诉我您方便的日期和时间，我会尽量调整我的日程来配合您。如果您有任何其他问题或需要更多信息，请随时告知我。\n\n期待与您进一步合作。\n\n此致敬礼,`
    },
    'en': {
      'professional': `${greeting ? "Dear " + greeting + ",\n\n" : ""}Thank you for your email. I have carefully reviewed your message and I'm very interested in what you've shared. I would like to suggest arranging a detailed discussion to better understand your needs and explore potential collaboration opportunities. Please let me know what times would be convenient for you, and I'll do my best to accommodate your schedule.\n\nI look forward to your reply.\n\nBest regards,`,
      'friendly': `${greeting ? "Hi " + greeting + ",\n\n" : ""}Thanks so much for your email! I was really happy to hear from you. What you mentioned sounds really interesting, and I'd love to chat more about it. If you're free, maybe we could set up a time to talk in more detail, or we could hop on a call if that works better for you.\n\nLooking forward to hearing back from you soon!\n\nCheers,`,
      'concise': `${greeting ? greeting + ",\n\n" : ""}Received your email and I'm interested in the matter you've raised. I suggest we arrange a meeting or call to discuss further. Please advise your availability.\n\nRegards,`,
      'detailed': `${greeting ? "Dear " + greeting + ",\n\n" : ""}Thank you very much for your email. I have thoroughly reviewed all the information you provided and I'm very interested in what you've shared. Based on your message, I believe there is excellent potential for collaboration between us.\n\nI would like to propose scheduling a detailed meeting where we can dive deeper into all aspects of this project. During this meeting, we can explore your specific requirements, expected outcomes, timelines, and other relevant details.\n\nPlease let me know what dates and times would be convenient for you, and I will adjust my schedule accordingly. If you have any other questions or need additional information, please don't hesitate to ask.\n\nI look forward to our future collaboration.\n\nSincerely,`
    },
    'ja': {
      'professional': `${greeting ? greeting + "様\n\n" : ""}お世話になっております。メールをいただきありがとうございます。内容を拝見し、大変興味深く思いました。ご提案について詳しく理解し、潜在的な協力の可能性を探るため、詳細な議論の機会を設けさせていただきたいと思います。ご都合の良い日時をお知らせいただければ、可能な限り調整させていただきます。\n\nご返信をお待ちしております。\n\n敬具`,
      'friendly': `${greeting ? greeting + "さん\n\n" : ""}メールありがとうございます！ご連絡いただき嬉しいです。ご提案いただいた内容にとても興味があります。もし良ければ、詳しくお話しする時間を設けることができますか？または、お電話でのご連絡の方が良ければ、そちらでも構いません。\n\nお返事楽しみにしています！\n\nよろしくお願いいたします。`,
      'concise': `${greeting ? greeting + "様\n\n" : ""}メールを拝受いたしました。ご提案に興味があります。詳細を協議するため、会議またはお電話での打ち合わせをご提案いたします。ご都合の良い時間をお知らせください。\n\n敬具`,
      'detailed': `${greeting ? greeting + "様\n\n" : ""}お世話になっております。メールをお送りいただき、誠にありがとうございます。ご提供いただいた情報をすべて慎重に検討いたしました。ご提案の内容に大変興味を持っており、私どもとの間で優れた協力の可能性があると確信しております。\n\nこのプロジェクトのすべての側面について詳しく話し合うことができる詳細な会議を設定することを提案させていただきます。この会議では、お客様の特定の要件、期待される成果、タイムライン、その他の関連詳細を探ることができます。\n\nご都合の良い日時をお知らせいただければ、それに応じて私のスケジュールを調整いたします。その他ご質問やさらに詳しい情報が必要な場合は、どうぞお気軽にお尋ねください。\n\n今後の協力を楽しみにしております。\n\n敬具`
    }
  };
  
  // Default to English if language not supported
  const langTemplates = templates[language] || templates['en'];
  const toneTemplate = langTemplates[tone] || langTemplates['professional'];
  
  return toneTemplate;
}

// Function to generate AI reply using Gemini
async function generateGeminiReply(emailContent, apiKey, tone, language, originalLanguage) {
  console.log("Preparing Gemini API request");
  
  // Trim content if too long
  const maxLength = 4000;
  const trimmedContent = emailContent.length > maxLength ? 
    emailContent.substring(0, maxLength) + "..." : 
    emailContent;
  
  // Enhanced prompt for Gemini with more detailed instructions
  const prompt = `你是一位有经验的专业邮件助理，请为这封邮件生成一个${getToneInChinese(tone)}且有深度的回复。

分析要点：
1. 识别这封邮件的类型（商务、咨询、求职等）
2. 明确发件人的身份和目的
3. 提取邮件中的关键信息和请求
4. 注意任何特殊称呼、日期、事件或地点

生成要求：
1. 使用${language !== 'detect' ? getLanguageName(language) : '与原始邮件相同的语言'}
2. 回复应详细、有针对性，不要使用泛泛而谈的内容
3. 保持${getToneInChinese(tone)}的口吻，但语言要自然流畅
4. 包含适当的问候语和结束语
5. 如有必要，提出明确的后续步骤或问题
6. 字数适中，正文至少100字以上，但不超过300字

原始邮件内容:
${trimmedContent}

请直接生成完整的回复内容，包括适当的称呼和结束语。如果邮件内容不明确，可以基于有限信息做出合理推测。`;

  console.log("Enhanced prompt prepared, sending to Gemini API");
  
  try {
    // Try different model endpoints
    const modelEndpoints = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro',
      'gemini-2.0-pro',
      'gemini-2.0-flash'
    ];
    
    let lastError = null;
    
    // Try each endpoint until one works
    for (const model of modelEndpoints) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(`Trying model: ${model}`);
        console.log("Request URL:", apiUrl.replace(apiKey, "API_KEY_HIDDEN"));
        
        // Updated request body with increased temperature for more creative responses
        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048  // Increased token limit for longer replies
          }
        };
        
        // Call Gemini API
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        // Log response status
        console.log(`${model} API response status:`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`${model} API Error Response:`, errorText);
          throw new Error(`API响应错误: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        // Log response structure (without sensitive content)
        console.log(`${model} response structure:`, JSON.stringify({
          hasError: !!data.error,
          hasCandidate: !!(data.candidates && data.candidates.length > 0),
          candidateCount: data.candidates ? data.candidates.length : 0
        }));
        
        if (data.error) {
          console.error(`${model} API returned error:`, data.error);
          throw new Error(data.error.message || "Gemini API 返回错误");
        }
        
        // Extract the text from Gemini's response - updated path based on API docs
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
          const replyText = data.candidates[0].content.parts[0].text;
          console.log(`Successfully extracted reply text from ${model}, length:`, replyText.length);
          return replyText;
        } else {
          console.error(`Invalid response format from ${model}:`, JSON.stringify(data));
          throw new Error(`模型 ${model} 返回的数据格式无效，无法提取回复内容`);
        }
      } catch (error) {
        console.warn(`Error with ${model}:`, error.message);
        lastError = error;
        // Continue to next model
      }
    }
    
    // If we get here, all models failed
    throw lastError || new Error("所有Gemini模型都无法生成回复");
    
  } catch (error) {
    console.error("Exception during Gemini API call:", error);
    throw new Error("调用Gemini API时出错: " + error.message);
  }
}

// Helper function to get tone in Chinese
function getToneInChinese(tone) {
  const tones = {
    'professional': '专业',
    'friendly': '友好',
    'concise': '简洁',
    'detailed': '详细'
  };
  
  return tones[tone] || '专业';
}

// Helper function to get language name
function getLanguageName(code) {
  const languages = {
    'en': '英语',
    'zh': '中文',
    'es': '西班牙语',
    'fr': '法语',
    'de': '德语',
    'ja': '日语'
  };
  
  return languages[code] || '英语';
}