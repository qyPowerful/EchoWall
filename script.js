// script.js

// ============= 全局变量 =============
let mappings = null;
let isLoading = true;

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
// 检查model.js是否正确加载
function checkModel() {
    log('检查model.js加载状态');
    log('originalPredict 是否存在:', typeof window.originalPredict === 'function');
    
    if (typeof window.originalPredict === 'function') {
        try {
            const testInput = new Array(12).fill(0);
            log('测试模型输入:', testInput);
            const testResult = window.originalPredict(testInput);
            log('模型测试结果:', testResult);
            return true;
        } catch (e) {
            error('模型测试失败:', e);
            return false;
        }
    }
    return false;
}

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
            error('验证失败，字段未填写:', field);
            return false;
        }
    }
    log('输入验证通过');
    return true;
}

// 收集输入数据并转换
function collectInputs() {
    log('开始收集输入数据');
    const inputs = {};
    const features = mappings.feature_order;
    
    // 收集原始输入
    features.forEach(feature => {
        const element = document.getElementById(feature);
        if (element) {
            inputs[feature] = element.value;
            log(`收集到输入 ${feature} = ${element.value}`);
        }
    });
    
    // 转换数据
    const processedInputs = [];
    features.forEach(feature => {
        const value = inputs[feature];
        const mapping = mappings.mappings[feature];
        const processedValue = mapping[value];
        log(`转换 ${feature}: ${value} -> ${processedValue}`);
        processedInputs.push(processedValue);
    });
    
    log('最终处理后的输入数组:', processedInputs);
    return processedInputs;
}

// 更新显示结果
function updateResults(probability) {
    log('更新显示结果:', probability);
    
    try {
        // 转换为百分比
        const percentage = (probability * 100).toFixed(1);
        
        // 更新显示
        document.getElementById('risk-value').textContent = percentage + '%';
        document.getElementById('risk-percentage').textContent = percentage + '%';
        
        // 显示结果容器
        document.getElementById('result').classList.add('show');
        
        log('结果显示更新完成');
    } catch (e) {
        error('更新显示结果失败:', e);
        throw e;
    }
}

// ============= 主要功能函数 =============
// 主预测函数
window.predict = function() {
    log('进入predict函数');
    try {
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
        const probability = window.originalPredict(inputArray);
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
// 加载mappings数据
log('开始加载mappings数据...');
fetch('mappings.json')
    .then(response => response.json())
    .then(data => {
        log('Mappings加载成功:', data);
        mappings = data;
        isLoading = false;
    })
    .catch(err => {
        error('Mappings加载失败:', err);
        alert('数据加载失败，请刷新页面重试');
    });

// 页面加载完成后的检查
window.addEventListener('load', function() {
    log('页面加载完成');
    log('检查组件加载状态');
    log('window.predict =', window.predict);
    log('window.originalPredict =', window.originalPredict);
    log('window.mappings =', window.mappings);
    
    // 检查模型
    if (checkModel()) {
        log('模型加载成功');
    } else {
        error('模型加载失败');
    }
    
    log('初始化完成');
});

// 进度指示器更新
function updateProgressIndicator(step) {
    try {
        // 移除所有步骤的active类
        document.querySelectorAll('.step-number').forEach(el => {
            el.classList.remove('active');
        });
        
        // 为当前步骤添加active类
        const currentStep = document.querySelector(`.progress-step:nth-child(${step}) .step-number`);
        if (currentStep) {
            currentStep.classList.add('active');
        }
        
        log('更新进度指示器:', step);
    } catch (e) {
        error('更新进度指示器失败:', e);
    }
}

// 为每个表单部分添加事件监听器
document.addEventListener('DOMContentLoaded', function() {
    try {
        const sections = document.querySelectorAll('.form-section');
        sections.forEach((section, index) => {
            const inputs = section.querySelectorAll('select');
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    // 检查当前部分是否已填写完整
                    const currentSectionInputs = Array.from(section.querySelectorAll('select'));
                    const isCurrentSectionComplete = currentSectionInputs.every(input => input.value);
                    
                    if (isCurrentSectionComplete) {
                        updateProgressIndicator(index + 2);
                    }
                });
            });
        });
        
        log('表单事件监听器设置完成');
    } catch (e) {
        error('设置表单事件监听器失败:', e);
    }
});
