// ============= 全局变量 =============
let mappings = null;
let isLoading = true;
let originalPredict = null;  // 将originalPredict改为变量

// ============= 调试日志函数 =============
function log(message, data = null) {
    if (data) {
        console.log(`DEBUG: ${message}`, data);
    } else {
        console.log(`DEBUG: ${message}`);
    }
}

function error(message, err = null) {
    if (err) {
        console.error(`ERROR: ${message}`, err);
    } else {
        console.error(`ERROR: ${message}`);
    }
}

// ============= 初始化函数 =============
// 等待model.js加载完成
function waitForModel(maxAttempts = 10) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        function checkModel() {
            attempts++;
            log(`检查model.js加载，第${attempts}次尝试`);
            
            if (typeof window.predict === 'function') {
                log('找到model.js中的predict函数');
                originalPredict = window.predict;  // 保存原始predict函数
                resolve(true);
                return;
            }
            
            if (attempts >= maxAttempts) {
                reject(new Error('等待model.js超时'));
                return;
            }
            
            setTimeout(checkModel, 100);  // 100ms后重试
        }
        
        checkModel();
    });
}

// ============= 工具函数 =============
// 检查model.js是否正确加载
function checkModel() {
    log('检查model.js加载状态');
    log('originalPredict 是否存在:', typeof originalPredict === 'function');
    
    if (typeof originalPredict === 'function') {
        try {
            const testInput = new Array(12).fill(0);
            log('测试模型输入:', testInput);
            const testResult = originalPredict(testInput);
            log('模型测试结果:', testResult);
            return true;
        } catch (e) {
            error('模型测试失败:', e);
            return false;
        }
    }
    return false;
}

// [其他函数保持不变...]

// ============= 主要功能函数 =============
// 主预测函数
window.predict = async function() {
    log('进入predict函数');
    try {
        // 确保model.js已加载
        if (!originalPredict) {
            try {
                await waitForModel();
            } catch (e) {
                throw new Error('模型加载失败，请刷新页面重试');
            }
        }
        
        // 检查model.js
        if (!checkModel()) {
            throw new Error('模型未正确加载，请刷新页面重试');
        }
        
        // 检查mappings
        if (!mappings) {
            throw new Error('数据未加载完成，请刷新页面重试');
        }
        
        // 验证输入
        if (!validateInputs()) {
            return;
        }
        
        // 收集和处理输入数据
        const inputArray = collectInputs();
        
        // 调用模型预测
        log('调用模型预测');
        const probability = originalPredict(inputArray);
        log('预测结果:', probability);
        
        // 验证预测结果
        if (typeof probability !== 'number' || isNaN(probability)) {
            throw new Error('模型返回了无效的结果');
        }
        
        // 确保概率值在0-1之间
        const validProbability = Math.max(0, Math.min(1, probability));
        
        // 更新显示
        updateResults(validProbability);
        
    } catch (error) {
        error('预测过程出错:', error);
        alert('预测过程出现错误: ' + error.message);
    }
}

// ============= 初始化代码 =============
// 页面加载完成后的初始化
window.addEventListener('load', async function() {
    log('页面加载完成');
    
    try {
        // 等待model.js加载
        await waitForModel();
        log('模型加载成功');
        
        // 加载mappings数据
        log('开始加载mappings数据...');
        const response = await fetch('mappings.json');
        const data = await response.json();
        log('Mappings加载成功:', data);
        mappings = data;
        isLoading = false;
        
    } catch (err) {
        error('初始化失败:', err);
        alert('系统初始化失败，请刷新页面重试');
    }
});

// [其他代码保持不变...]
