// 점수 매핑
const scoring = {
    smoking: {
        "never": 20,
        "rare": 10,
        "often": -10,
        "past": 5
    },
    alcohol: {
        "none": 15,
        "week1": 5,
        "week2_3": -5,
        "daily": -15
    },
    exercise: {
        "none": -10,
        "week1_2": 5,
        "week3_5": 15,
        "daily": 20
    },
    sleep: {
        "<5": -10,
        "5_6": 0,
        "7_8": 15,
        "9plus": 5
    },
    chronic: {
        none: 20,
        one: 5,
        multi: -10
    },
    meds: { 
        yes: -5, 
        no: 5 
    },
    stress: { 
        low: 10, 
        mid: 0, 
        high: -10 
    }
};

window.healthLastDisplay = null;

// 건강수명 계산 함수
function calculateHealthLifespan(data) {
    const { age, sex } = data;
    
    // 성별에 따른 기본 기대수명
    let baseLife;
    if (sex === "male") {
        baseLife = 76;
    } else if (sex === "female") {
        baseLife = 82;
    } else {
        baseLife = 79; // 기타의 경우 평균
    }
    
    let score = 0;
    
    // 각 항목별 점수 계산
    score += scoring.smoking[data.smoking] || 0;
    score += scoring.alcohol[data.alcohol] || 0;
    score += scoring.exercise[data.exercise] || 0;
    score += scoring.sleep[data.sleep] || 0;
    
    // 만성질환 점수 계산
    const chronicCount = data.chronicCount || 0;
    if (chronicCount === 0) {
        score += scoring.chronic.none;
    } else if (chronicCount === 1) {
        score += scoring.chronic.one;
    } else {
        score += scoring.chronic.multi;
    }
    
    score += scoring.meds[data.meds] || 0;
    score += scoring.stress[data.stress] || 0;
    
    // 예상 건강수명 계산
    const predicted = Math.max(
        baseLife - 10,
        baseLife + Math.round(score / 5)
    );
    
    const remainHealthy = Math.max(0, predicted - age);
    
    return {
        predictedHealthSpan: predicted,
        yearsRemaining: remainHealthy,
        score: score,
        baseLife: baseLife
    };
}

// 개선 포인트 계산
function calculateImprovementPoints(data) {
    const improvements = [];
    // 전역 t 함수 사용
    const t = window.t || ((key) => key);
    
    if (data.exercise === "none") {
        improvements.push({ 
            text: t("improvementExerciseNone"), 
            points: 25, 
            current: scoring.exercise.none 
        });
    } else if (data.exercise === "week1_2") {
        improvements.push({ 
            text: t("improvementExerciseWeek1_2"), 
            points: 10, 
            current: scoring.exercise.week1_2 
        });
    }
    
    if (data.sleep === "<5" || data.sleep === "5_6") {
        improvements.push({ 
            text: t("improvementSleep"), 
            points: 15, 
            current: scoring.sleep[data.sleep] 
        });
    }
    
    if (data.alcohol === "daily" || data.alcohol === "week2_3") {
        improvements.push({ 
            text: t("improvementAlcoholReduce"), 
            points: 10, 
            current: scoring.alcohol[data.alcohol] 
        });
    } else if (data.alcohol === "week1") {
        improvements.push({ 
            text: t("improvementAlcoholStop"), 
            points: 10, 
            current: scoring.alcohol.week1 
        });
    }
    
    if (data.stress === "high") {
        improvements.push({ 
            text: t("improvementStressManage"), 
            points: 10, 
            current: scoring.stress.high 
        });
    } else if (data.stress === "mid") {
        improvements.push({ 
            text: t("improvementStressReduce"), 
            points: 10, 
            current: scoring.stress.mid 
        });
    }
    
    return improvements;
}

// 상태 요약 텍스트 생성
function getStatusSummary(score) {
    if (score >= 30) {
        return {
            typeKey: "statusBalancedLabel",
            summaryKey: "statusBalancedSummary"
        };
    } else if (score >= 0) {
        return {
            typeKey: "statusRecoverLabel",
            summaryKey: "statusRecoverSummary"
        };
    }

    return {
        typeKey: "statusRiskLabel",
        summaryKey: "statusRiskSummary"
    };
}

// 폼 제출 처리
document.getElementById('healthForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        age: parseInt(formData.get('age')),
        sex: formData.get('sex'),
        smoking: formData.get('smoking'),
        alcohol: formData.get('alcohol'),
        exercise: formData.get('exercise'),
        sleep: formData.get('sleep'),
        meds: formData.get('meds'),
        stress: formData.get('stress')
    };
    
    // 만성질환 체크박스 처리
    const chronicCheckboxes = document.querySelectorAll('input[name="chronic"]:checked');
    const chronicCount = Array.from(chronicCheckboxes).filter(cb => cb.value !== 'none').length;
    data.chronicCount = chronicCount;
    
    // 결과 계산
    const result = calculateHealthLifespan(data);
    const improvements = calculateImprovementPoints(data);
    const statusInfo = getStatusSummary(result.score);
    
    // 결과 표시
    displayResults(result, improvements, statusInfo, data);
    
    // 입력 섹션 숨기기, 결과 섹션 표시
    document.getElementById('inputSection').classList.add('hidden');
    document.getElementById('resultSection').classList.remove('hidden');
    
    // 결과 섹션으로 스크롤
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
});

// 결과 표시 함수
function displayResults(result, improvements, statusInfo, data) {
    // 전역 t 함수 사용
    const t = window.t || ((key, vars) => key);
    
    document.getElementById('predictedAge').textContent = result.predictedHealthSpan;
    document.getElementById('yearsRemaining').textContent = 
        t('yearsRemainingLabel', { years: result.yearsRemaining });
    
    const statusSummaryEl = document.getElementById('statusSummary');
    const statusLabel = t(statusInfo.typeKey);
    const statusDescription = t(statusInfo.summaryKey);
    statusSummaryEl.innerHTML = `
        ${t('statusSummaryTemplate', { status: statusLabel })}<br>
        ${statusDescription}
    `;
    
    document.getElementById('lifespanScore').textContent = result.score >= 0 ? `+${result.score}` : result.score;
    
    const riskPoints = Math.abs(Math.min(0, result.score));
    document.getElementById('riskScore').textContent = riskPoints > 0 ? `-${riskPoints}` : '0';
    
    const improvementTotal = improvements.reduce((sum, imp) => sum + imp.points, 0);
    document.getElementById('improvementScore').textContent = `+${improvementTotal}`;
    
    const improvementListEl = document.getElementById('improvementList');
    if (improvements.length > 0) {
        improvementListEl.innerHTML = improvements.map(imp => `
            <div class="improvement-item">
                <strong>${imp.text}</strong>
                <span class="points">${t('pointsTemplate', { points: imp.points })}</span>
            </div>
        `).join('');
    } else {
        improvementListEl.innerHTML = t('improvementListEmpty');
    }
    
    const improvementSummaryEl = document.getElementById('improvementSummary');
    if (improvementTotal > 0) {
        const additionalYears = Math.round(improvementTotal / 5);
        improvementSummaryEl.textContent = t('improvementSummaryRange', {
            min: additionalYears,
            max: additionalYears + 2
        });
    } else {
        improvementSummaryEl.textContent = t('improvementSummaryDefault');
    }

    window.healthLastDisplay = {
        result,
        statusInfo,
        data
    };
}

window.refreshHealthDisplay = function () {
    const state = window.healthLastDisplay;
    const resultSection = document.getElementById('resultSection');
    if (!state || (resultSection && resultSection.classList.contains('hidden'))) {
        return;
    }
    const improvements = calculateImprovementPoints(state.data);
    displayResults(state.result, improvements, state.statusInfo, state.data);
};

// 폼 리셋 함수
function resetForm() {
    document.getElementById('healthForm').reset();
    document.getElementById('inputSection').classList.remove('hidden');
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('inputSection').scrollIntoView({ behavior: 'smooth' });
    window.healthLastDisplay = null;
}

// 만성질환 체크박스 로직 (없음 선택 시 다른 것들 해제)
document.addEventListener('DOMContentLoaded', function() {
    const chronicNone = document.getElementById('chronic-none');
    const chronicOthers = document.querySelectorAll('input[name="chronic"]:not(#chronic-none)');
    
    chronicNone.addEventListener('change', function() {
        if (this.checked) {
            chronicOthers.forEach(cb => cb.checked = false);
        }
    });
    
    chronicOthers.forEach(cb => {
        cb.addEventListener('change', function() {
            if (this.checked) {
                chronicNone.checked = false;
            }
        });
    });
    
});
