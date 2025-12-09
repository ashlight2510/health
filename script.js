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
    
    // 운동 개선
    if (data.exercise === "none") {
        improvements.push({ 
            text: "운동 주 3회만 해도", 
            points: 25, 
            current: scoring.exercise.none 
        });
    } else if (data.exercise === "week1_2") {
        improvements.push({ 
            text: "운동 주 3~5회로 늘리면", 
            points: 10, 
            current: scoring.exercise.week1_2 
        });
    }
    
    // 수면 개선
    if (data.sleep === "<5" || data.sleep === "5_6") {
        improvements.push({ 
            text: "수면 7~8시간 맞추면", 
            points: 15, 
            current: scoring.sleep[data.sleep] 
        });
    }
    
    // 음주 개선
    if (data.alcohol === "daily" || data.alcohol === "week2_3") {
        improvements.push({ 
            text: "음주 줄이면", 
            points: 10, 
            current: scoring.alcohol[data.alcohol] 
        });
    } else if (data.alcohol === "week1") {
        improvements.push({ 
            text: "음주 완전히 끊으면", 
            points: 10, 
            current: scoring.alcohol.week1 
        });
    }
    
    // 스트레스 개선
    if (data.stress === "high") {
        improvements.push({ 
            text: "스트레스 관리하면", 
            points: 10, 
            current: scoring.stress.high 
        });
    } else if (data.stress === "mid") {
        improvements.push({ 
            text: "스트레스 더 줄이면", 
            points: 10, 
            current: scoring.stress.mid 
        });
    }
    
    return improvements;
}

// 상태 요약 텍스트 생성
function getStatusSummary(score, data) {
    let summary = "";
    let type = "";
    
    if (score >= 30) {
        type = "균형형";
        summary = "현재 생활습관이 양호합니다. 꾸준히 유지하시면 건강한 노후를 보낼 수 있을 것 같습니다.";
    } else if (score >= 0) {
        type = "회복필요형";
        summary = "몇 가지 개선하면 더 건강한 노후를 준비할 수 있습니다. 아래 개선 포인트를 참고해보세요.";
    } else {
        type = "리스크높음형";
        summary = "생활습관 개선이 필요합니다. 지금부터 바꾸면 건강수명을 늘릴 수 있는 여지가 충분합니다.";
    }
    
    return {
        type: type,
        summary: summary
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
    const statusInfo = getStatusSummary(result.score, data);
    
    // 결과 표시
    displayResults(result, improvements, statusInfo, data);
    
    // 입력 섹션 숨기기, 결과 섹션 표시
    document.getElementById('inputSection').classList.add('hidden');
    document.getElementById('resultSection').classList.remove('hidden');
    
    // 광고 초기화 (결과 섹션이 표시된 후)
    setTimeout(() => {
        if (window.daum && window.daum.ad && window.daum.ad.publish) {
            window.daum.ad.publish();
        }
    }, 500);
    
    // 결과 섹션으로 스크롤
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
});

// 결과 표시 함수
function displayResults(result, improvements, statusInfo, data) {
    // 예상 건강수명
    document.getElementById('predictedAge').textContent = result.predictedHealthSpan;
    document.getElementById('yearsRemaining').textContent = 
        `남은 건강 연식: ${result.yearsRemaining}년`;
    
    // 상태 요약
    const statusSummaryEl = document.getElementById('statusSummary');
    statusSummaryEl.innerHTML = `
        <strong>생활습관: ${statusInfo.type}</strong><br>
        ${statusInfo.summary}
    `;
    
    // 점수 표시
    document.getElementById('lifespanScore').textContent = result.score >= 0 ? `+${result.score}` : result.score;
    
    // 리스크 포인트 (음수 점수 합계)
    const riskPoints = Math.abs(Math.min(0, result.score));
    document.getElementById('riskScore').textContent = riskPoints > 0 ? `-${riskPoints}` : '0';
    
    // 회복 가능 포인트
    const improvementTotal = improvements.reduce((sum, imp) => sum + imp.points, 0);
    document.getElementById('improvementScore').textContent = `+${improvementTotal}`;
    
    // 개선 포인트 리스트
    const improvementListEl = document.getElementById('improvementList');
    if (improvements.length > 0) {
        improvementListEl.innerHTML = improvements.map(imp => `
            <div class="improvement-item">
                <strong>${imp.text}</strong>
                <span class="points">+${imp.points}포인트</span>
            </div>
        `).join('');
    } else {
        improvementListEl.innerHTML = '<p style="text-align: center; color: #999;">이미 좋은 생활습관을 유지하고 계시네요!</p>';
    }
    
    // 개선 요약
    if (improvementTotal > 0) {
        const additionalYears = Math.round(improvementTotal / 5);
        document.getElementById('improvementSummary').textContent = 
            `지금부터 바꾸면 건강수명 + ${additionalYears}~${additionalYears + 2}년 가능 (재미용)`;
    } else {
        document.getElementById('improvementSummary').textContent = 
            '현재 생활습관을 유지하시면 됩니다!';
    }
}

// 폼 리셋 함수
function resetForm() {
    document.getElementById('healthForm').reset();
    document.getElementById('inputSection').classList.remove('hidden');
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('inputSection').scrollIntoView({ behavior: 'smooth' });
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

