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
  
  // Look for the email thread using multiple selectors
  const threadSelectors = [
    '.gE.iv.gt',  // Standard thread container
    '.h7',        // Another possible thread container
    '.gs',        // Thread in conversation view
    '.adn',       // Inside thread content
    '.a3s.aiL',   // Email content directly
    '[data-message-id]' // Messages with IDs
  ];
  
  // Try all thread selectors
  let emailContent = "";
  let detectedLanguage = "en";
  
  for (const selector of threadSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector ${selector}`);
      
      // Get the last element (most recent email)
      const latestElement = elements[elements.length - 1];
      console.log("Latest element content:", latestElement.innerText.substring(0, 100) + "...");
      
      if (latestElement.innerText && latestElement.innerText.length > 10) {
        emailContent = latestElement.innerText;
        break;
      }
    }
  }
  
  // If still no content, try looking at any visible email content on the page
  if (!emailContent) {
    console.log("No content found with standard selectors, trying generic approach");
    
    // Try to find the email body by looking at the visible text in the main content area
    const mainContent = document.querySelector('.AO');
    if (mainContent) {
      const visibleTextElements = Array.from(mainContent.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               el.innerText.length > 30;
      });
      
      console.log(`Found ${visibleTextElements.length} visible text elements`);
      
      // Get the longest text content as it's likely the email body
      if (visibleTextElements.length > 0) {
        const longestTextElement = visibleTextElements.reduce((longest, current) => 
          current.innerText.length > longest.innerText.length ? current : longest
        );
        
        emailContent = longestTextElement.innerText;
        console.log("Using longest visible text element:", emailContent.substring(0, 100) + "...");
      }
    }
  }
  
  // Debugging output
  if (!emailContent || emailContent.length < 10) {
    // Dump all visible text elements to console for debugging
    console.log("Email content extraction failed, dumping page text:");
    const allTextElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.innerText && el.innerText.trim().length > 20 && 
      window.getComputedStyle(el).display !== 'none'
    );
    
    allTextElements.forEach((el, i) => {
      console.log(`Text element ${i}:`, el.innerText.substring(0, 50) + "...");
    });
    
    // Create a fallback content
    console.log("Using fallback content");
    emailContent = "这是一封测试邮件，请生成一个简短的回复。如果你看到这个内容，说明插件无法正确提取邮件内容。";
    detectedLanguage = "zh";
  } else {
    console.log("Email content extracted successfully, length:", emailContent.length);
    
    // Try to detect language
    if (/[\u4e00-\u9fa5]/.test(emailContent)) {
      detectedLanguage = "zh"; // Chinese characters present
    } else if (/[áéíóúüñ¿¡]/i.test(emailContent)) {
      detectedLanguage = "es"; // Spanish characters present
    } else if (/[àâçéèêëîïôùûüÿ]/i.test(emailContent)) {
      detectedLanguage = "fr"; // French characters present
    } else if (/[äöüß]/i.test(emailContent)) {
      detectedLanguage = "de"; // German characters present
    } else if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(emailContent)) {
      detectedLanguage = "ja"; // Japanese characters present
    }
  }
  
  console.log("Detected language:", detectedLanguage);
  return { content: emailContent, language: detectedLanguage };
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