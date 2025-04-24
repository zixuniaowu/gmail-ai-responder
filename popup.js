document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'tone', 'language'], function(data) {
    if (data.apiKey) {
      document.getElementById('api-key').value = data.apiKey;
    }
    if (data.tone) {
      document.getElementById('tone').value = data.tone;
    }
    if (data.language) {
      document.getElementById('language').value = data.language;
    }
  });

  // Save settings button
  document.getElementById('save-settings').addEventListener('click', function() {
    const apiKey = document.getElementById('api-key').value;
    const tone = document.getElementById('tone').value;
    const language = document.getElementById('language').value;

    if (!apiKey) {
      document.getElementById('status-message').textContent = '请输入API密钥！';
      document.getElementById('status-message').style.color = '#d93025';
      return;
    }

    chrome.storage.sync.set({
      apiKey: apiKey,
      tone: tone,
      language: language
    }, function() {
      const statusMessage = document.getElementById('status-message');
      statusMessage.textContent = '设置已保存！';
      statusMessage.style.color = '#1a73e8';
      
      // Reset status message after 2 seconds
      setTimeout(function() {
        statusMessage.textContent = '扩展已准备就绪';
        statusMessage.style.color = '#1a73e8';
      }, 2000);
      
      // Test API key validity
      testApiKey(apiKey);
    });
  });
  
  // Add test button functionality
  const testButton = document.createElement('button');
  testButton.id = 'test-api-key';
  testButton.textContent = '测试API密钥';
  testButton.style.marginTop = '10px';
  testButton.style.backgroundColor = '#34a853';
  
  document.getElementById('save-settings').after(testButton);
  
  testButton.addEventListener('click', function() {
    const apiKey = document.getElementById('api-key').value;
    if (!apiKey) {
      document.getElementById('status-message').textContent = '请先输入API密钥！';
      document.getElementById('status-message').style.color = '#d93025';
      return;
    }
    
    testApiKey(apiKey);
  });
});

// Function to test API key validity
function testApiKey(apiKey) {
  const statusMessage = document.getElementById('status-message');
  statusMessage.textContent = '正在测试API密钥...';
  
  // Simple test prompt
  const testBody = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: "你好，请回复一句简短的问候语。"
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 20
    }
  });
  
  // 更新为使用gemini-2.0-flash模型的端点
  fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: testBody
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        console.error("API Error:", response.status, text);
        throw new Error(`API响应错误: ${response.status} - ${text}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.error) {
      statusMessage.textContent = `API密钥无效: ${data.error.message}`;
      statusMessage.style.color = '#d93025';
    } else {
      statusMessage.textContent = '✓ API密钥有效！';
      statusMessage.style.color = '#34a853';
      
      // Reset status message after 3 seconds
      setTimeout(function() {
        statusMessage.textContent = '扩展已准备就绪';
        statusMessage.style.color = '#1a73e8';
      }, 3000);
    }
  })
  .catch(error => {
    statusMessage.textContent = `测试API密钥时出错: ${error.message}`;
    statusMessage.style.color = '#d93025';
  });
}