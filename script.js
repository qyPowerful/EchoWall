// ===== 第一步：最开头就保存原始predict并重写 =====
// 保存模型的原始predict函数
const originalPredict = window.predict;

// 重写predict函数
window.predict = function() {
    console.log('开始预测流程...');
    try {
        // 检查数据是否正在加载
        if (isLoading) {
            showError('数据正在加载，请稍候...');
            return;
        }

        // 检查mappings是否已加载
        if (!mappings) {
            showError('数据加载不完整，请刷新页面');
            return;
        }

        // 验证输入
        if (!validateInputs()) {
            return;
        }

        // 收集并转换输入数据
        const inputArray = collectInputs();

        // 验证输入数组
        if (!Array.isArray(inputArray)) {
            showError('输入数据格式错误');
            return;
        }
        if (inputArray.length !== mappings.feature_order.length) { // 修改这里
            showError(`输入数组长度错误: ${inputArray.length}, 应该为 ${mappings.feature_order.length}`); // 修改这里
            return;
        }

        // 禁用提交按钮
        disableSubmitButton();

        // 调用原始predict函数进行预测
        console.log('调用模型进行预测...');
        const probability = originalPredict(inputArray);
        console.log('预测结果:', probability);

        // 验证预测结果
        if (typeof probability !== 'number' || isNaN(probability)) {
            showError('无效的预测结果');
            return;
        }

        // 更新结果显示
        updateResults(probability);

    } catch (error) {
        console.error('预测过程出错:', error);
        showError('预测过程出错: ' + error.message);
    } finally {
        // 无论成功与否，都启用提交按钮
        enableSubmitButton();
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
    'Education': 'Education',
    'race': 'Race',
    'activities': 'Activities',
    'hearing': 'Hearing',
    'tg': 'TG',
    'tinnitus': 'Tinnitus',
    'cho': 'CHO',
    'dairy': 'Dairy',
    'smoke': 'Smoke',
    'hbp': 'HBP', // 添加 HBP
    'glu': 'GLU', // 添加 GLU
    'drink': 'Drink', // 添加 Drink
    'bmi': 'BMI_rank' // 添加 BMI_rank
};

// 必填字段
const REQUIRED_FIELDS = [
    'age_rank', 'sex', 'Education', 'race',
    'activities', 'dairy', 'smoke', 'hearing',
    'tinnitus', 'tg', 'cho', 'hbp', 'glu', 'drink', 'bmi' // 添加 HBP, GLU, Drink, BMI_rank
];

// 定义每个步骤对应的字段 ID
const STEP_FIELDS = {
    1: ['age_rank', 'sex', 'Education', 'race'], // Basic Information
    2: ['activities', 'dairy', 'smoke'], // Lifestyle Habits
    3: ['hearing', 'tinnitus', 'tg', 'cho'], // Medical History
    4: ['hbp', 'glu', 'drink', 'bmi'] // Clinical Test Results
};

// ===== 第三步：辅助函数定义 =====
// 更新进度指示器
function updateProgressIndicator(step) {
    console.log('更新进度指示器:', step);
    document.querySelectorAll('.step-number').forEach((element, index) => {
        if (index + 1 <= step) {
            element.classList.add('active');
            // 确保对应的progress-step也被标记为active
            const parentStep = element.closest('.progress-step');
            if (parentStep && !parentStep.classList.contains('active')) {
                parentStep.classList.add('active');
            }
        } else {
            element.classList.remove('active');
            // 移除对应的progress-step的active类
            const parentStep = element.closest('.progress-step');
            if (parentStep && parentStep.classList.contains('active')) {
                parentStep.classList.remove('active');
            }
        }
    });
}

// 检查所有必填字段
function validateInputs() {
    console.log('验证输入字段...');

    for (const field of REQUIRED_FIELDS) {
        const element = document.getElementById(field);
        if (!element) {
            console.error(`字段 ${field} 未找到`);
            showError(`系统错误：字段 ${field} 未找到，请联系管理员。`);
            return false;
        }
        const value = element.value;
        if (!value) {
            showError('请填写所有必填字段');
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
        showError('Mapping 数据未正确加载');
        return;
    }

    // 创建一个对象来存储所有输入值
    const inputs = {};
    const elements = document.querySelectorAll('select');
    elements.forEach(element => {
        const featureId = element.id;
        const featureName = idToFeature[featureId];
        if (!featureName) {
            showError(`Feature name not found for field ${featureId}`);
            return;
        }
        inputs[featureName] = element.value;
    });
    console.log('收集到的原始输入:', inputs);

    // 根据feature_order创建输入数组
    const inputArray = mappings.feature_order.map(feature => {
        const value = inputs[feature];
        if (value === undefined) {
            showError(`Input value not found for feature ${feature}`);
            return;
        }

        // 获取该特征的映射值
        const featureMapping = mappings.mappings[feature];
        if (!featureMapping) {
            showError(`Mapping not found for feature ${feature}`);
            return;
        }

        // 返回映射后的标准化值
        const mappedValue = featureMapping[value];
        if (mappedValue === undefined) {
            showError(`Mapping value not found for feature ${feature} value ${value}`);
            return;
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

// 显示错误信息 (替换 alert)
function showError(message) {
    // 可以使用模态框、页面内消息提示等更美观的方式
    console.error(message);
    alert(message); // 临时使用 alert
}

// 禁用提交按钮
function disableSubmitButton() {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
    }
}

// 启用提交按钮
function enableSubmitButton() {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.disabled = false;
    }
}

// 检查表单部分是否完成
function checkFormSectionCompletion() {
    // 检查每个步骤是否完成
    for (let step = 1; step <= 4; step++) {
        const stepFields = STEP_FIELDS[step];
        const stepComplete = stepFields.every(id => {
            const element = document.getElementById(id);
            return element && element.value !== '';
        });

        if (stepComplete) {
            updateProgressIndicator(step);
        }
    }
}

// ===== 第四步：初始化 =====
// 加载mappings数据
document.addEventListener('DOMContentLoaded', function() {
    console.log('开始加载mappings数据...');

    // 禁用提交按钮
    disableSubmitButton();

    // 显示加载指示器 (假设有一个 id 为 loading-indicator 的元素)
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
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
        })
        .catch(error => {
            console.error('Mappings加载失败:', error);
            showError('数据加载失败，请检查您的网络连接并刷新页面。');
        })
        .finally(() => {
            // 隐藏加载指示器
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            // 启用提交按钮
            enableSubmitButton();
        });

    // 为所有select添加change事件监听器
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', function() {
            checkFormSectionCompletion();
        });
    });

    // 初始化时也检查一次表单完成情况
    checkFormSectionCompletion();
});

// 导出更新进度指示器函数
window.updateProgressIndicator = updateProgressIndicator;
