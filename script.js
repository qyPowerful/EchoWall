// script.js

console.log('DEBUG: script.js 开始加载');

// 全局变量
let mappings = null;
let isLoading = true;

// 加载mappings数据
console.log('开始加载mappings数据...');
fetch('mappings.json')
    .then(response => response.json())
    .then(data => {
        console.log('Mappings加载成功:', data);
        mappings = data;
        isLoading = false;
    })
    .catch(error => {
        console.error('Mappings加载失败:', error);
        alert('数据加载失败，请刷新页面重试');
    });

// 验证所有输入是否已填写
function validateInputs() {
    console.log('DEBUG: 开始验证输入');
    const requiredFields = [
        'age_rank', 'sex', 'education', 'race',
        'activities', 'dairy', 'fruit', 'smoke',
        'hearing', 'tinnitus', 'tg', 'cho'
    ];

    for (const field of requiredFields) {
        const element = document.getElementById(field);
        if (!element || !element.value) {
            alert('请填写所有必填项');
            console.log('DEBUG: 验证失败，字段未填写:', field);
            return false;
        }
    }
    console.log('DEBUG: 输入验证通过');
    return true;
}

// 收集输入数据并转换
function collectInputs() {
    console.log('DEBUG: 开始收集输入数据');
    const inputs = {};
    const features = mappings.feature_order;
    
    features.forEach(feature => {
        const element = document.getElementById(feature);
        if (element) {
            inputs[feature] = element.value;
            console.log(`DEBUG: 收集到输入 ${feature} = ${element.value}`);
        }
    });
    
    // 转换数据
    const processedInputs = [];
    features.forEach(feature => {
        const value = inputs[feature];
        const mapping = mappings.mappings[feature];
        const processedValue = mapping[value];
        console.log(`DEBUG: 转换 ${feature}: ${value} -> ${processedValue}`);
        processedInputs.push(processedValue);
    });
    
    console.log('DEBUG: 最终处理后的输入数组:', processedInputs);
    return processedInputs;
}

// 更新显示结果
function updateResults(probability) {
    console.log('DEBUG: 更新显示结果:', probability);
    
    // 转换为百分比
    const percentage = (probability * 100).toFixed(1);
    
    // 更新显示
    document.getElementById('risk-value').textContent = percentage + '%';
    document.getElementById('risk-percentage').textContent = percentage + '%';
    
    // 显示结果容器
    document.getElementById('result').classList.add('show');
}

// 主预测函数
window.predict = function() {
    console.log('DEBUG: 进入predict函数');
    try {
        // 检查数据加载状态
        console.log('DEBUG: 检查加载状态 isLoading =', isLoading);
        console.log('DEBUG: 检查mappings =', mappings);
        
        if (isLoading) {
            throw new Error('数据正在加载中...');
        }
        
        if (!mappings) {
            throw new Error('数据未加载完成...');
        }

        // 检查模型是否加载
        if (typeof originalPredict !== 'function') {
            console.error('DEBUG: 模型未正确加载');
            throw new Error('模型未正确加载，请刷新页面重试');
        }

        // 验证输入
        if (!validateInputs()) {
            return;
        }

        // 收集和处理输入数据
        const inputArray = collectInputs();
        console.log('DEBUG: 处理后的输入数组:', inputArray);
        
        // 调用模型预测
        console.log('DEBUG: 调用模型预测');
        const probability = originalPredict(inputArray);
        console.log('DEBUG: 预测结果:', probability);
        
        // 验证预测结果
        if (typeof probability !== 'number' || isNaN(probability)) {
            throw new Error('模型返回了无效的结果');
        }
        
        // 确保概率值在0-1之间
        const validProbability = Math.max(0, Math.min(1, probability));
        
        // 更新显示
        updateResults(validProbability);
        
    } catch (error) {
        console.error('DEBUG: 预测过程出错:', error);
        alert('预测过程出现错误: ' + error.message);
    }
}

// 页面加载完成后的检查
window.addEventListener('load', function() {
    console.log('DEBUG: 页面加载完成');
    console.log('DEBUG: 检查组件加载状态');
    console.log('window.predict =', window.predict);
    console.log('window.originalPredict =', window.originalPredict);
    console.log('window.mappings =', window.mappings);
    
    // 测试模型是否可用
    if (typeof originalPredict === 'function') {
        console.log('DEBUG: 模型函数已加载');
        try {
            const testInput = new Array(12).fill(0);
            const testResult = originalPredict(testInput);
            console.log('DEBUG: 模型测试结果:', testResult);
        } catch (e) {
            console.error('DEBUG: 模型测试失败:', e);
        }
    } else {
        console.error('DEBUG: 模型函数未加载');
    }
    
    console.log('所有组件加载完成');
});
