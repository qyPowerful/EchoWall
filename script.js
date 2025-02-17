// ===== 第一步：最开头就保存原始predict并重写 =====
// 保存模型的原始predict函数
const originalPredict = window.predict;

// 重写predict函数
window.predict = function() {
    console.log('开始预测流程...');
    try {
        // 检查数据是否正在加载
        if (isLoading) {
            throw new Error('数据正在加载中，请稍候...');
        }
        
        // 检查mappings是否已加载
        if (!mappings) {
            throw new Error('数据未加载完成，请刷新页面重试');
        }

        // 验证输入
        if (!validateInputs()) {
            return;
        }

        // 更新进度指示器
        updateProgressIndicator(3);

        // 收集并转换输入数据
        const inputArray = collectInputs();
        
        // 验证输入数组
        if (!Array.isArray(inputArray)) {
            throw new Error('输入数据格式错误');
        }
        if (inputArray.length !== 12) {
            throw new Error(`输入数组长度错误: ${inputArray.length}, 应为12`);
        }

        // 调用原始predict函数进行预测
        console.log('调用模型进行预测...');
        const probability = originalPredict(inputArray);
        console.log('预测结果:', probability);

        // 验证预测结果
        if (typeof probability !== 'number' || isNaN(probability)) {
            throw new Error('预测结果无效');
        }

        // 更新结果显示
        updateResults(probability);

    } catch (error) {
        console.error('预测过程出错:', error);
        alert('预测过程出现错误: ' + error.message);
    }
}

// ===== 第二步：变量定义 =====
// 使用局部变量存储mappings
let mappings = null;
let isLoading = true; // 添加加载状态标志

// ID到特征名的映射
const idToFeature = {
    'age_rank': 'Age_rank',
    'sex': 'Sex',
    'education': 'Education',
    'race': 'Race',
    'activities': 'Activities',
    'hearing': 'Hearing',
    'tg': 'TG',
    'tinnitus': 'Tinnitus',
    'cho': 'CHO',
    'dairy': 'Dairy',
    'smoke': 'Smoke',
    'fruit': 'Fruit'
};

// ===== 第三步：辅助函数定义 =====
// 更新进度指示器
function updateProgressIndicator(step) {
    console.log('更新进度指示器:', step);
    document.querySelectorAll('.step-number').forEach((element, index) => {
        if (index + 1 <= step) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    });
}

// 检查所有必填字段
function validateInputs() {
    console.log('验证输入字段...');
    const requiredFields = [
        'age_rank', 'sex', 'education', 'race',
        'activities', 'dairy', 'fruit', 'smoke',
        'hearing', 'tinnitus', 'tg', 'cho'
    ];
    
    for (const field of requiredFields) {
        const element = document.getElementById(field);
        if (!element) {
            console.error(`字段 ${field} 未找到`);
            return false;
        }
        const value = element.value;
        if (!value) {
            alert('请填写所有必填项');
            element.focus();
            console.log(`字段 ${field} 未填写`);
            return false;
        }
    }
    console.log('所有字段验证通过');
    return true;
}

// 收集并转换输入数据
function collectInputs() {
    console.log('开始收集输入数据...');
    if (!mappings || !mappings.feature_order) {
        throw new Error('映射数据未正确加载');
    }

    // 创建一个对象来存储所有输入值
    const inputs = {};
    const elements = document.querySelectorAll('select');
    elements.forEach(element => {
        const featureId = element.id;
        const featureName = idToFeature[featureId];
        if (!featureName) {
            throw new Error(`未找到字段 ${featureId} 对应的特征名`);
        }
        inputs[featureName] = element.value;
    });
    console.log('收集到的原始输入:', inputs);

    // 根据feature_order创建输入数组
    const inputArray = mappings.feature_order.map(feature => {
        const value = inputs[feature];
        if (value === undefined) {
            throw new Error(`特征 ${feature} 未找到对应的输入值`);
        }
        
        // 获取该特征的映射值
        const featureMapping = mappings.mappings[feature];
        if (!featureMapping) {
            throw new Error(`特征 ${feature} 未找到对应的映射`);
        }

        // 返回映射后的标准化值
        const mappedValue = featureMapping[value];
        if (mappedValue === undefined) {
            throw new Error(`特征 ${feature} 的值 ${value} 未找到对应的映射值`);
        }

        return mappedValue;
    });

    console.log('转换后的输入数组:', inputArray);
    return inputArray;
}

// 更新结果显示
function updateResults(probability) {
    console.log('更新预测结果:', probability);
    const percentage = (probability * 100).toFixed(1);
    
    // 更新风险值显示
    document.getElementById('risk-value').textContent = percentage + '%';
    document.getElementById('risk-percentage').textContent = percentage + '%';
    
    // 显示结果容器
    const resultContainer = document.getElementById('result');
    resultContainer.classList.add('show');
    
    // 平滑滚动到结果区域
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// ===== 第四步：初始化 =====
// 加载mappings数据
document.addEventListener('DOMContentLoaded', function() {
    console.log('开始加载mappings数据...');
    
    // 禁用提交按钮
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
    }

    fetch('mappings.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            mappings = data;
            isLoading = false;
            console.log('Mappings加载成功:', data);
            // 启用提交按钮
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Mappings加载失败:', error);
            alert('数据加载失败，请刷新页面重试');
        });

    // 为所有select添加change事件监听器
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', function() {
            // 当用户开始填写表单时，激活第一个进度点
            updateProgressIndicator(1);
            
            // 如果第一部分的所有字段都已填写，激活第二个进度点
            const firstSection = ['age_rank', 'sex', 'education', 'race'];
            const firstSectionComplete = firstSection.every(id => 
                document.getElementById(id).value !== ''
            );
            if (firstSectionComplete) {
                updateProgressIndicator(2);
            }
        });
    });
});

// 导出更新进度指示器函数
window.updateProgressIndicator = updateProgressIndicator;
