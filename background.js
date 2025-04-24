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
        
        // Format the response with HTML for proper line breaks
        const formattedResponse = formatEmailResponseHTML(response, request.originalLanguage);
        
        sendResponse({ success: true, reply: formattedResponse });
      } catch (error) {
        console.error("Error generating reply:", error);
        
        // Generate a fallback response when API fails
        const fallbackReply = generateFallbackReply(
          request.emailContent,
          data.tone || 'professional',
          request.originalLanguage || 'en'
        );
        
        console.log("Using fallback reply:", fallbackReply);
        
        // Format the fallback response with HTML
        const formattedFallback = formatEmailResponseHTML(fallbackReply, request.originalLanguage);
        
        // Return fallback reply instead of error message for better user experience
        sendResponse({ 
          success: true, 
          reply: formattedFallback
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

// Format the email response with HTML paragraph tags for proper line breaks
function formatEmailResponseHTML(text, language) {
  // If already formatted with HTML, don't modify
  if (text.includes("<div>") || text.includes("<p>") || text.includes("<br>")) {
    return text;
  }
  
  // Remove any excess line breaks
  text = text.replace(/\n{3,}/g, "\n\n");
  
  // Split into paragraphs
  const paragraphs = text.split(/\n{1,2}/);
  
  // Process each paragraph and convert to HTML
  const htmlParagraphs = paragraphs.map(para => {
    if (!para.trim()) return ""; // Skip empty lines
    return `<div style="margin-bottom: 12px;">${para}</div>`;
  });
  
  // Join all paragraphs
  return htmlParagraphs.join("");
}

// Generate a fallback reply when API fails
function generateFallbackReply(emailContent, tone, language) {
  console.log("Generating fallback reply in language:", language);
  
  // Extract sender name if possible
  let senderName = "";
  const nameMatch = emailContent.match(/([A-Z][a-z]+)\s+([A-Z][a-z]+)|([^\s,]+)\s+([^\s,]+)/);
  if (nameMatch) {
    senderName = nameMatch[0];
  }
  
  // Simple templates for different languages - now using HTML format
  const templates = {
    'zh': {
      'professional': `<div style="margin-bottom: 12px;">${senderName ? senderName + "，" : ""}</div>
<div style="margin-bottom: 12px;">感谢您的邮件。</div>
<div style="margin-bottom: 12px;">我已仔细阅读了您的信息，并对您提出的内容非常感兴趣。</div>
<div style="margin-bottom: 12px;">我们可以安排一次详细的讨论，以便更好地了解您的需求和探讨可能的合作机会。</div>
<div style="margin-bottom: 12px;">请告诉我您方便的时间，我会尽量配合您的日程安排。</div>
<div style="margin-bottom: 12px;">期待您的回复。</div>
<div style="margin-bottom: 12px;">此致,</div>`,
      'friendly': `<div style="margin-bottom: 12px;">${senderName ? senderName + "，" : ""}</div>
<div style="margin-bottom: 12px;">谢谢你的邮件！</div>
<div style="margin-bottom: 12px;">看到你的来信我真的很高兴。关于你提到的事情，我觉得非常有意思，很愿意进一步交流。</div>
<div style="margin-bottom: 12px;">如果你有空，我们可以约个时间详细聊聊，或者如果你愿意的话，也可以直接通过电话沟通。</div>
<div style="margin-bottom: 12px;">期待很快听到你的回音！</div>
<div style="margin-bottom: 12px;">祝好,</div>`,
      'concise': `<div style="margin-bottom: 12px;">${senderName ? senderName + "，" : ""}</div>
<div style="margin-bottom: 12px;">已收到您的邮件，对您提出的事项很感兴趣。</div>
<div style="margin-bottom: 12px;">建议我们安排一次会面或通话进一步讨论。</div>
<div style="margin-bottom: 12px;">请告知您的可用时间。</div>
<div style="margin-bottom: 12px;">谢谢,</div>`,
      'detailed': `<div style="margin-bottom: 12px;">${senderName ? senderName + "，" : ""}</div>
<div style="margin-bottom: 12px;">非常感谢您发送这封邮件。</div>
<div style="margin-bottom: 12px;">我已经仔细阅读了您提供的所有信息，并且对您提出的内容非常感兴趣。基于您所述的情况，我认为我们有很好的合作空间。</div>
<div style="margin-bottom: 12px;">我想提议安排一次详细的会议，以便我们能够更深入地讨论这个项目的各个方面。在会议中，我们可以探讨您的具体需求、预期目标、时间表以及其他相关细节。</div>
<div style="margin-bottom: 12px;">请告诉我您方便的日期和时间，我会尽量调整我的日程来配合您。如果您有任何其他问题或需要更多信息，请随时告知我。</div>
<div style="margin-bottom: 12px;">期待与您进一步合作。</div>
<div style="margin-bottom: 12px;">此致敬礼,</div>`
    },
    'en': {
      'professional': `<div style="margin-bottom: 12px;">${senderName ? "Dear " + senderName + "," : ""}</div>
<div style="margin-bottom: 12px;">Thank you for your email.</div>
<div style="margin-bottom: 12px;">I have carefully reviewed your message and I'm very interested in what you've shared.</div>
<div style="margin-bottom: 12px;">I would like to suggest arranging a detailed discussion to better understand your needs and explore potential collaboration opportunities.</div>
<div style="margin-bottom: 12px;">Please let me know what times would be convenient for you, and I'll do my best to accommodate your schedule.</div>
<div style="margin-bottom: 12px;">I look forward to your reply.</div>
<div style="margin-bottom: 12px;">Best regards,</div>`,
      'friendly': `<div style="margin-bottom: 12px;">${senderName ? "Hi " + senderName + "," : ""}</div>
<div style="margin-bottom: 12px;">Thanks so much for your email!</div>
<div style="margin-bottom: 12px;">I was really happy to hear from you. What you mentioned sounds really interesting, and I'd love to chat more about it.</div>
<div style="margin-bottom: 12px;">If you're free, maybe we could set up a time to talk in more detail, or we could hop on a call if that works better for you.</div>
<div style="margin-bottom: 12px;">Looking forward to hearing back from you soon!</div>
<div style="margin-bottom: 12px;">Cheers,</div>`,
      'concise': `<div style="margin-bottom: 12px;">${senderName ? senderName + "," : ""}</div>
<div style="margin-bottom: 12px;">Received your email and I'm interested in the matter you've raised.</div>
<div style="margin-bottom: 12px;">I suggest we arrange a meeting or call to discuss further.</div>
<div style="margin-bottom: 12px;">Please advise your availability.</div>
<div style="margin-bottom: 12px;">Regards,</div>`,
      'detailed': `<div style="margin-bottom: 12px;">${senderName ? "Dear " + senderName + "," : ""}</div>
<div style="margin-bottom: 12px;">Thank you very much for your email.</div>
<div style="margin-bottom: 12px;">I have thoroughly reviewed all the information you provided and I'm very interested in what you've shared. Based on your message, I believe there is excellent potential for collaboration between us.</div>
<div style="margin-bottom: 12px;">I would like to propose scheduling a detailed meeting where we can dive deeper into all aspects of this project. During this meeting, we can explore your specific requirements, expected outcomes, timelines, and other relevant details.</div>
<div style="margin-bottom: 12px;">Please let me know what dates and times would be convenient for you, and I will adjust my schedule accordingly. If you have any other questions or need additional information, please don't hesitate to ask.</div>
<div style="margin-bottom: 12px;">I look forward to our future collaboration.</div>
<div style="margin-bottom: 12px;">Sincerely,</div>`
    },
    'ja': {
      'professional': `<div style="margin-bottom: 12px;">${senderName ? senderName + "様" : ""}</div>
<div style="margin-bottom: 12px;">お世話になっております。</div>
<div style="margin-bottom: 12px;">メールをいただきありがとうございます。</div>
<div style="margin-bottom: 12px;">内容を拝見し、大変興味深く思いました。</div>
<div style="margin-bottom: 12px;">ご提案について詳しく理解し、潜在的な協力の可能性を探るため、詳細な議論の機会を設けさせていただきたいと思います。</div>
<div style="margin-bottom: 12px;">ご都合の良い日時をお知らせいただければ、可能な限り調整させていただきます。</div>
<div style="margin-bottom: 12px;">ご返信をお待ちしております。</div>
<div style="margin-bottom: 12px;">敬具</div>`,
      'friendly': `<div style="margin-bottom: 12px;">${senderName ? senderName + "さん" : ""}</div>
<div style="margin-bottom: 12px;">メールありがとうございます！</div>
<div style="margin-bottom: 12px;">ご連絡いただき嬉しいです。</div>
<div style="margin-bottom: 12px;">ご提案いただいた内容にとても興味があります。</div>
<div style="margin-bottom: 12px;">もし良ければ、詳しくお話しする時間を設けることができますか？</div>
<div style="margin-bottom: 12px;">または、お電話でのご連絡の方が良ければ、そちらでも構いません。</div>
<div style="margin-bottom: 12px;">お返事楽しみにしています！</div>
<div style="margin-bottom: 12px;">よろしくお願いいたします。</div>`,
      'concise': `<div style="margin-bottom: 12px;">${senderName ? senderName + "様" : ""}</div>
<div style="margin-bottom: 12px;">メールを拝受いたしました。</div>
<div style="margin-bottom: 12px;">ご提案に興味があります。</div>
<div style="margin-bottom: 12px;">詳細を協議するため、会議またはお電話での打ち合わせをご提案いたします。</div>
<div style="margin-bottom: 12px;">ご都合の良い時間をお知らせください。</div>
<div style="margin-bottom: 12px;">敬具</div>`,
      'detailed': `<div style="margin-bottom: 12px;">${senderName ? senderName + "様" : ""}</div>
<div style="margin-bottom: 12px;">お世話になっております。</div>
<div style="margin-bottom: 12px;">メールをお送りいただき、誠にありがとうございます。</div>
<div style="margin-bottom: 12px;">ご提供いただいた情報をすべて慎重に検討いたしました。</div>
<div style="margin-bottom: 12px;">ご提案の内容に大変興味を持っており、私どもとの間で優れた協力の可能性があると確信しております。</div>
<div style="margin-bottom: 12px;">このプロジェクトのすべての側面について詳しく話し合うことができる詳細な会議を設定することを提案させていただきます。</div>
<div style="margin-bottom: 12px;">この会議では、お客様の特定の要件、期待される成果、タイムライン、その他の関連詳細を探ることができます。</div>
<div style="margin-bottom: 12px;">ご都合の良い日時をお知らせいただければ、それに応じて私のスケジュールを調整いたします。</div>
<div style="margin-bottom: 12px;">その他ご質問やさらに詳しい情報が必要な場合は、どうぞお気軽にお尋ねください。</div>
<div style="margin-bottom: 12px;">今後の協力を楽しみにしております。</div>
<div style="margin-bottom: 12px;">敬具</div>`
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
  
  // Enhanced prompt for Gemini with instructions to use HTML formatting
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

格式要求（非常重要）：
1. 每个段落都应该使用以下HTML格式: <div style="margin-bottom: 12px;">段落内容</div>
2. 问候语应单独在一个<div>标签中
3. 每个自然段落都应该用单独的<div>标签包围
4. 结束语和签名也应该单独成段
5. 不要使用普通的换行符（\n），而是使用HTML标签确保正确格式化

原始邮件内容:
${trimmedContent}

请直接生成完整的回复内容，包括适当的称呼和结束语。如果邮件内容不明确，可以基于有限信息做出合理推测。确保回复使用HTML格式，以便在Gmail中正确显示段落和换行。`;

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
