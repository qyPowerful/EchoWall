// ============= 全局变量 =============
let mappings = null;
let originalPredict = null;

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

// ============= 工具函数 =============
// 验证所有输入是否已填写
function validateInputs() {
    log('开始验证输入');
    const requiredFields = [
        'age_rank', 'sex', 'education', 'race',
        'activities', 'dairy', 'fruit', 'smoke',
        'hearing', 'tinnitus', 'tg', 'cho'
    ];

    for (const field of requiredFields) {
        const element = document.getElementById(field);
        if (!element || !element.value) {
            alert('请填写所有必填项');
            return false;
        }
    }
    return true;
}

// 收集输入数据并转换
function collectInputs() {
    const inputs = {};
    const features = mappings.feature_order;
    
    features.forEach(feature => {
        const element = document.getElementById(feature.toLowerCase());
        if (element) {
            inputs[feature] = element.value;
        }
    });
    
    const processedInputs = features.map(feature => {
        const value = inputs[feature];
        return mappings.mappings[feature][value];
    });
    
    return processedInputs;
}

// 更新显示结果
function updateResults(probability) {
    const percentage = (probability * 100).toFixed(1);
    document.getElementById('risk-value').textContent = percentage + '%';
    document.getElementById('risk-percentage').textContent = percentage + '%';
    document.getElementById('result').classList.add('show');
}

// 更新进度指示器
function updateProgressIndicator(step) {
    document.querySelectorAll('.step-number').forEach(el => {
        el.classList.remove('active');
    });
    
    const currentStep = document.querySelector(`.progress-step:nth-child(${step}) .step-number`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
}

// ============= 初始化代码 =============
// 页面加载完成后的初始化
window.addEventListener('DOMContentLoaded', function() {
    // 加载mappings数据
    fetch('mappings.json')
        .then(response => response.json())
        .then(data => {
            mappings = data;
            log('Mappings加载成功');
            
            // 保存原始predict函数
            if (typeof window.predict === 'function') {
                originalPredict = window.predict;
                log('原始predict函数保存成功');
                
                // 重写predict函数
                window.predict = function() {
                    try {
                        if (!mappings) {
                            throw new Error('数据未加载完成，请刷新页面重试');
                        }
                        
                        if (!validateInputs()) {
                            return;
                        }
                        
                        const inputArray = collectInputs();
                        const probability = originalPredict(inputArray);
                        
                        if (typeof probability !== 'number' || isNaN(probability)) {
                            throw new Error('预测结果无效');
                        }
                        
                        const validProbability = Math.max(0, Math.min(1, probability));
                        updateResults(validProbability);
                        
                    } catch (error) {
                        alert('预测过程出现错误: ' + error.message);
                    }
                };
                
                log('predict函数重写成功');
            } else {
                error('model.js未正确加载');
            }
        })
        .catch(err => {
            error('初始化失败:', err);
            alert('系统初始化失败，请刷新页面重试');
        });
        
    // 设置表单事件监听器
    const sections = document.querySelectorAll('.form-section');
    sections.forEach((section, index) => {
        const inputs = section.querySelectorAll('select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const currentSectionInputs = Array.from(section.querySelectorAll('select'));
                const isCurrentSectionComplete = currentSectionInputs.every(input => input.value);
                
                if (isCurrentSectionComplete) {
                    updateProgressIndicator(index + 2);
                }
            });
        });
    });
});
