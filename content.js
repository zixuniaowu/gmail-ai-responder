// Main initialization function
function initializeAIResponder() {
  console.log("Gmail AI Responder initialized - 正在初始化Gmail AI回复助手");
  
  // Add mutation observer to detect when compose window opens
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        checkForComposeWindows();
      }
    }
  });
  
  // Start observing document body for changes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Initial check for already open compose windows
  setTimeout(checkForComposeWindows, 1000);
  
  // Additional check every 3 seconds to ensure we don't miss any compose windows
  setInterval(checkForComposeWindows, 3000);
}

// Function to check for compose windows and add AI button
function checkForComposeWindows() {
  console.log("Checking for compose windows - 正在查找撰写窗口");
  
  // Look for Gmail compose windows - try multiple selectors
  const composeSelectors = [
    '.aO.aOh', // Standard compose selector
    '.M9', // Another possible compose container
    '[role="dialog"][tabindex="0"]', // Dialog-based compose
    '.nH.Hd', // Reply form container
    '[role="textbox"]', // Any textbox in Gmail (may be too broad)
  ];
  
  let composeWindows = [];
  
  // Try each selector
  for (const selector of composeSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector ${selector}`);
      composeWindows = [...composeWindows, ...elements];
    }
  }
  
  if (composeWindows.length === 0) {
    console.log("No compose windows found - 未找到撰写窗口");
    // Inject a floating button as fallback
    injectFloatingButton();
    return;
  }
  
  composeWindows.forEach(composeWindow => {
    // Check if we already added our button to this compose window
    if (composeWindow.querySelector('.ai-responder-btn')) {
      return;
    }
    
    console.log("Found compose window, adding AI button - 找到撰写窗口，添加AI按钮");
    
    // Find the toolbar in the compose window - try multiple potential parent elements
    let toolbar = null;
    const toolbarSelectors = [
      '.aB.gQ.pE', // Standard toolbar
      '.aB', // Simplified toolbar selector
      '.aS', // Another toolbar class
      '.nr.nw' // Bottom options bar
    ];
    
    for (const selector of toolbarSelectors) {
      toolbar = composeWindow.querySelector(selector);
      if (toolbar) {
        console.log(`Found toolbar with selector ${selector}`);
        break;
      }
    }
    
    // If no toolbar found, try to find a fallback insertion point
    if (!toolbar) {
      console.log("No toolbar found, looking for fallback - 未找到工具栏，寻找备选位置");
      // Try to find any good insertion point
      toolbar = composeWindow.querySelector('[role="textbox"]')?.parentElement;
      
      if (!toolbar) {
        console.log("No suitable insertion point found - 未找到合适的插入位置");
        return;
      }
    }
    
    // Create the AI button - using a more visible style
    const aiButton = document.createElement('div');
    aiButton.className = 'ai-responder-btn';
    aiButton.innerHTML = `
      <div class="ai-btn" title="Generate AI Reply - 生成AI回复">
        <div style="background-color: #4285f4; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; display: flex; align-items: center;">
          <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="margin-right: 5px;">
            <path fill="white" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8
            s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z"/>
            <path fill="white" d="M14,10h-4v2h4v2l3-3l-3-3V10z"/>
          </svg>
          AI回复
        </div>
      </div>
    `;
    
    // Add button styles
    const style = document.createElement('style');
    style.textContent = `
      .ai-responder-btn {
        margin-right: 12px;
        cursor: pointer;
        z-index: 1000;
      }
      .ai-btn:hover {
        opacity: 0.9;
      }
      .ai-loading {
        animation: spin 1.5s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .ai-error-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 80%;
        max-height: 80%;
        overflow: auto;
      }
      .ai-error-message h3 {
        margin-top: 0;
        color: #d93025;
      }
      .ai-error-message pre {
        background: #f5f5f5;
        padding: 10px;
        overflow: auto;
        border-radius: 4px;
      }
      .ai-error-message button {
        background: #4285f4;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      }
    `;
    document.head.appendChild(style);
    
    // Add event listener to AI button
    aiButton.addEventListener('click', function() {
      generateReply(composeWindow);
    });
    
    // Add the button to the toolbar
    try {
      toolbar.insertBefore(aiButton, toolbar.firstChild);
      console.log("Successfully added AI button - 成功添加AI按钮");
    } catch (e) {
      console.error("Error adding AI button:", e);
    }
  });
}

// Fallback: inject a floating button if no compose window is found
function injectFloatingButton() {
  if (document.querySelector('#floating-ai-btn')) {
    return; // Already exists
  }
  
  const floatingBtn = document.createElement('div');
  floatingBtn.id = 'floating-ai-btn';
  floatingBtn.innerHTML = `
    <div style="position: fixed; bottom: 20px; right: 20px; background-color: #4285f4; color: white; 
                padding: 10px 15px; border-radius: 50px; font-weight: bold; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.2); display: flex; align-items: center;">
      <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="margin-right: 5px;">
        <path fill="white" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8
        s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z"/>
        <path fill="white" d="M14,10h-4v2h4v2l3-3l-3-3V10z"/>
      </svg>
      AI回复助手
    </div>
  `;
  
  floatingBtn.addEventListener('click', function() {
    // Try to find any compose window
    const composeWindow = document.querySelector('[role="textbox"]')?.closest('div[role="dialog"]') || 
                         document.querySelector('[role="textbox"]')?.parentElement;
    
    if (composeWindow) {
      generateReply(composeWindow);
    } else {
      showErrorMessage("请打开一封邮件并点击回复按钮，然后再使用AI回复助手。", "未找到邮件撰写窗口");
    }
  });
  
  document.body.appendChild(floatingBtn);
  console.log("Added floating button - 添加了浮动按钮");
}

// Show error in a modal
function showErrorMessage(errorMsg, title = "错误", details = null) {
  // Remove any existing error messages
  const existingError = document.querySelector('.ai-error-message');
  if (existingError) {
    existingError.remove();
  }
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'ai-error-message';
  
  let detailsHtml = '';
  if (details) {
    detailsHtml = `
      <div style="margin-top: 10px;">
        <strong>技术详情：</strong>
        <pre>${details}</pre>
      </div>
    `;
  }
  
  errorDiv.innerHTML = `
    <h3>${title}</h3>
    <p>${errorMsg}</p>
    ${detailsHtml}
    <div style="display: flex; justify-content: space-between;">
      <button id="ai-error-close">关闭</button>
      <button id="ai-error-check-settings">检查设置</button>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
  
  // Add event listeners to buttons
  document.getElementById('ai-error-close').addEventListener('click', function() {
    errorDiv.remove();
  });
  
  document.getElementById('ai-error-check-settings').addEventListener('click', function() {
    errorDiv.remove();
    
    // Trigger click on extension icon (this is a best effort, may not work in all browsers)
    const extensionId = chrome.runtime.id;
    chrome.runtime.sendMessage({action: "openPopup"});
    
    // Show message about checking settings
    alert("请点击Chrome工具栏中的扩展图标，检查您的Gemini API密钥是否正确设置。");
  });
  
  // Close on click outside
  document.addEventListener('click', function closeErrorOnClickOutside(event) {
    if (!errorDiv.contains(event.target) && document.body.contains(errorDiv)) {
      errorDiv.remove();
      document.removeEventListener('click', closeErrorOnClickOutside);
    }
  });
}

// Function to extract email content from the compose window
function getEmailContent(composeWindow) {
  console.log("Attempting to extract email content - 尝试提取邮件内容");
  
  // Debug: Log all potential email content containers
  console.log("All potential email content containers:");
  
  // First, try to capture the visible Subject line which often has important context
  let subjectLine = "";
  const subjectElements = document.querySelectorAll('.hP, [data-thread-title]');
  if (subjectElements.length > 0) {
    subjectLine = subjectElements[0].textContent;
    console.log("Found subject line:", subjectLine);
  }
  
  // Try to find sender information
  let senderInfo = "";
  const senderElements = document.querySelectorAll('.gD, .go');
  if (senderElements.length > 0) {
    senderInfo = senderElements[0].textContent;
    console.log("Found sender info:", senderInfo);
  }
  
  // Look for the email thread using multiple selectors, with specific additions for Japanese content
  const threadSelectors = [
    // Standard content selectors
    '.adn .a3s',           // Standard email content
    '.h7 .ii',             // Another content container
    '.ii[dir="ltr"]',      // LTR direction content (often used for non-CJK)
    '.ii[dir="rtl"]',      // RTL direction content
    '.gs .ii',             // Thread content
    '.g2',                 // Sometimes contains email body
    
    // Specific to Asian languages (CJK)
    '.ii[lang="ja"]',      // Japanese specific content
    '.ii[lang="zh"]',      // Chinese specific content
    '[data-thread-perm-id]', // Thread permanent ID container (often contains content)
    
    // Very specific selectors for when standard ones fail
    '.iA .g6',             // Alternative content containers
    '.nH[role="main"] .ii', // Main content area's message
    '.a3s.aiL'             // Another common content class
  ];
  
  // Additional selectors for direct/manual text content discovery
  const directTextSelectors = [
    '.Subject',            // Subject text that might contain context
    '.ha h2',              // Subject headers
    '.nH .ii > div'        // Direct children of .ii (often contains the text)
  ];
  
  // Combine all selectors for thorough search
  const allSelectors = [...threadSelectors, ...directTextSelectors];
  
  // Try all selectors to find content
  let emailContent = "";
  let contentFound = false;
  
  for (const selector of allSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector ${selector}`);
      
      // Try each element found
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const text = element.innerText;
        
        if (text && text.length > 30) { // Require at least 30 chars to avoid small fragments
          console.log(`Element ${i} with selector ${selector} contains: ${text.substring(0, 100)}...`);
          
          // If we find a good amount of text, use it
          if (text.length > emailContent.length) {
            emailContent = text;
            contentFound = true;
          }
        }
      }
    }
  }
  
  // If no content found yet, try a more aggressive approach - look for any visible text blocks
  if (!contentFound) {
    console.log("No content found with standard selectors, trying generic approach");
    
    // Find all elements that might contain visible text of reasonable length
    const allTextElements = Array.from(document.querySelectorAll('*')).filter(el => {
      if (!el.innerText || el.innerText.length < 50) return false;
      
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0';
    });
    
    console.log(`Found ${allTextElements.length} possible text elements`);
    
    if (allTextElements.length > 0) {
      // Sort by text length (descending) to get the most content-rich element
      allTextElements.sort((a, b) => b.innerText.length - a.innerText.length);
      
      // Get the longest text as it's likely the email body
      emailContent = allTextElements[0].innerText;
      console.log("Using longest text element:", emailContent.substring(0, 100) + "...");
      contentFound = true;
    }
  }
  
  // Look specifically for the quoted reply/forward content
  if (!contentFound) {
    const quotedContent = document.querySelector('.gmail_quote');
    if (quotedContent) {
      emailContent = quotedContent.innerText;
      console.log("Using quoted content:", emailContent.substring(0, 100) + "...");
      contentFound = true;
    }
  }
  
  // Check if there's content in the current reply compose box
  if (!contentFound) {
    const replyContent = composeWindow.querySelector('[role="textbox"]');
    if (replyContent && replyContent.innerText.length > 20) {
      // If there's already some text, it might be quoted content
      emailContent = replyContent.innerText;
      console.log("Using existing compose box content:", emailContent.substring(0, 100) + "...");
      contentFound = true;
    }
  }
  
  // If found subject but no content, at least include the subject
  if (!contentFound && subjectLine) {
    emailContent = "Subject: " + subjectLine;
    if (senderInfo) {
      emailContent += "\nFrom: " + senderInfo;
    }
    console.log("Using only subject and sender info as content");
    contentFound = true;
  }
  
  // Add "manual entry" text to indicate we're in last-resort mode
  if (!contentFound || emailContent.length < 20) {
    // Create a fallback that explicitly mentions the lack of content
    console.log("Using fallback content - no email content could be extracted");
    
    // Create a more helpful fallback for Japanese context
    const japaneseContext = isJapaneseContext();
    
    if (japaneseContext) {
      emailContent = "日本語のメールに返信しています。内容が自動的に検出できませんでした。礼儀正しく簡潔な返信を作成してください。" +
        (subjectLine ? "\n\n件名: " + subjectLine : "") +
        (senderInfo ? "\n送信者: " + senderInfo : "");
        
      return { content: emailContent, language: "ja" };
    } else {
      emailContent = "Replying to an email whose content couldn't be automatically detected. " +
        "Please create a polite and brief reply." +
        (subjectLine ? "\n\nSubject: " + subjectLine : "") +
        (senderInfo ? "\nSender: " + senderInfo : "");
    }
  }
  
  // Try to detect language from the content we found
  let detectedLanguage = detectLanguage(emailContent);
  console.log("Detected language:", detectedLanguage);
  
  return { content: emailContent, language: detectedLanguage };
}

// Helper function to check if we're in a Japanese context
function isJapaneseContext() {
  // Check for Japanese characters in the page
  const pageText = document.body.innerText;
  const hasJapaneseChars = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/.test(pageText);
  
  // Check for Japanese in URL or subject
  const url = window.location.href;
  const subjects = Array.from(document.querySelectorAll('.hP, [data-thread-title]'))
    .map(el => el.textContent);
  
  const hasJapaneseInMetadata = subjects.some(subject => 
    /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/.test(subject)
  );
  
  return hasJapaneseChars || hasJapaneseInMetadata;
}

// Helper function to detect language
function detectLanguage(text) {
  // Simple language detection logic
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    console.log("Detected Japanese characters");
    return "ja"; // Japanese characters present
  } else if (/[\u4e00-\u9fff]/.test(text)) {
    console.log("Detected Chinese characters");
    return "zh"; // Chinese characters present
  } else if (/[áéíóúüñ¿¡]/.test(text)) {
    console.log("Detected Spanish characters");
    return "es"; // Spanish characters present
  } else if (/[àâçéèêëîïôùûüÿ]/.test(text)) {
    console.log("Detected French characters");
    return "fr"; // French characters present
  } else if (/[äöüß]/.test(text)) {
    console.log("Detected German characters");
    return "de"; // German characters present
  }
  
  // Default to English
  return "en";
}

// Function to generate a reply using AI
function generateReply(composeWindow) {
  console.log("Generating reply - 正在生成回复");
  
  // Get the message composer element - try different selectors
  let messageBody = null;
  const textboxSelectors = [
    'div[role="textbox"]',
    '.Am.Al.editable',
    '[contenteditable="true"]'
  ];
  
  for (const selector of textboxSelectors) {
    messageBody = composeWindow.querySelector(selector);
    if (messageBody) {
      console.log(`Found message body with selector: ${selector}`);
      break;
    }
  }
  
  if (!messageBody) {
    // Try to find any editable element in the compose window
    console.log("Couldn't find message body with standard selectors, trying broader approach");
    messageBody = composeWindow.querySelector('[contenteditable]');
    
    if (!messageBody) {
      console.log("Still couldn't find message body - 未找到邮件正文区域");
      showErrorMessage('未能找到邮件编辑区域，请确保您已打开回复窗口。', '无法找到编辑器');
      return;
    }
  }
  
  // Get the email content from the thread
  const { content, language } = getEmailContent(composeWindow);
  
  // Show extracted content for debugging
  console.log("Extracted content:", content.substring(0, 200) + "...");
  console.log("Detected language:", language);
  
  if (!content) {
    console.log("No email content found - 未找到邮件内容");
    showErrorMessage('未能找到需要回复的邮件内容，但我们将尝试生成一个通用回复。', '无邮件内容');
  }
  
  // Capture any existing text in the compose box
  const existingText = messageBody.innerHTML;
  console.log("Existing text in compose box:", existingText.substring(0, 100) + "...");
  
  // Show loading indicator
  const statusMessage = document.createElement('div');
  statusMessage.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; background: rgba(66, 133, 244, 0.9); color: white; padding: 10px 20px; border-radius: 4px; z-index: 9999;">
      <div style="display: flex; align-items: center;">
        <div style="border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; width: 20px; height: 20px; margin-right: 10px; animation: spin 1s linear infinite;"></div>
        正在生成AI回复中...
      </div>
    </div>
  `;
  document.body.appendChild(statusMessage);
  
  // Add loading animation to button if it exists
  const aiButton = composeWindow.querySelector('.ai-responder-btn svg') || 
                 document.querySelector('#floating-ai-btn svg');
  
  if (aiButton) {
    aiButton.classList.add('ai-loading');
  }
  
  console.log("Sending request to background script - 发送请求到后台脚本");
  
  // Send message to background script to generate reply
  chrome.runtime.sendMessage({
    action: "generateReply",
    emailContent: content,
    originalLanguage: language
  }, function(response) {
    console.log("Received response from background script - 收到后台脚本的响应", response);
    
    // Remove loading indicators
    if (aiButton) {
      aiButton.classList.remove('ai-loading');
    }
    document.body.removeChild(statusMessage);
    
    if (response && response.success) {
      console.log("Successfully generated reply - 成功生成回复");
      // Insert AI-generated reply into compose window
      messageBody.innerHTML = response.reply;
      
      // Trigger input event to ensure Gmail saves the draft
      messageBody.dispatchEvent(new Event('input', {
        bubbles: true,
        cancelable: true
      }));
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: rgba(52, 168, 83, 0.9); color: white; padding: 10px 20px; border-radius: 4px; z-index: 9999;">
          AI回复已生成! 您可以在发送前编辑它。
        </div>
      `;
      document.body.appendChild(successMsg);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(successMsg)) {
          document.body.removeChild(successMsg);
        }
      }, 3000);
      
    } else {
      // Show error message
      const errorMsg = response ? response.message : "生成回复失败";
      const errorDetails = response && response.details ? response.details : null;
      console.error("AI Reply Error:", errorMsg, errorDetails);
      
      showErrorMessage(errorMsg, "AI回复生成失败", errorDetails);
      
      // Restore any existing text that was in the compose box
      if (existingText) {
        messageBody.innerHTML = existingText;
      }
    }
  });
}

// Start the extension when the page is fully loaded
window.addEventListener('load', initializeAIResponder);

// Also try to initialize if the page is already loaded
if (document.readyState === 'complete') {
  console.log("Document already loaded, initializing immediately - 文档已加载，立即初始化");
  initializeAIResponder();
}
