import { MiniGame } from './MiniGame.js';
import { GameState } from '../core/GameState.js';
import { UI } from '../core/UI.js';

const G9_QUESTIONS_POOL = [
    { q: "איך תוכיחו צמיחה בשוק?", correct: "עלייה של 300%", wrongs: ["אין מושג", "נתונים פרטיים", "המזל"] },
    { q: "מה היתרון התחרותי?", correct: "פטנט בלעדי", wrongs: ["המתחרים", "אין מתחרים", "זולים"] },
    { q: "מה המודל העסקי?", correct: "מנוי חודשי", wrongs: ["חינם לנצח", "נבקש תרומות", "נמכור מידע"] },
    { q: "מי קהל היעד?", correct: "צעירים 18-24", wrongs: ["כולם", "אף אחד", "רק אנחנו"] },
    { q: "מתי תהיו רווחיים?", correct: "ברבעון הבא", wrongs: ["אולי מתישהו", "לעולם לא", "מה זה רווח?"] },
    { q: "כמה הון גייסתם?", correct: "שני מיליון", wrongs: ["עשרים שקלים", "סוד כמוס", "כלום"] },
    { q: "מה אסטרטגיית היציאה?", correct: "הנפקה בנאסדק", wrongs: ["בריחה למקסיקו", "פשיטת רגל", "אין יציאה"] },
    { q: "למה שהמשתמשים ישלמו?", correct: "ערך מוסף אדיר", wrongs: ["כי נכריח אותם", "בטעות", "מתוך רחמים"] },
    { q: "מי המתחרים שלכם?", correct: "אין לנו מתחרים ישירים", wrongs: ["כולם", "גוגל ופייסבוק", "הדוכן ברחוב"] },
    { q: "כמה משתמשים פעילים?", correct: "מאה אלף ביום", wrongs: ["אני ואמא", "לא ספרנו", "כולם ישנים"] },
    { q: "מה חזון החברה?", correct: "לשנות את העולם", wrongs: ["לעשות אקזיט ולישון", "אין לנו חזון", "לקנות יאכטה"] },
    { q: "מה אחוז הנטישה?", correct: "פחות מאחוז", wrongs: ["מאה אחוז", "כולם בורחים", "מה זה נטישה?"] }
];

export class Game9_Funding extends MiniGame {
    init(difficulty) {
        UI.screens.container.className = 'relative w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl sm:shadow-2xl overflow-hidden bg-teal-50';

        this.g9Score = 0;
        this.g9Lives = 3;
        this.g9TimeLeft = 100;
        this.g9CurrentQ = null;
        this.g9Phase = 'WAIT'; // 'ASKING', 'RESULT', 'WAIT'

        this.g9MaxTime = (difficulty === 'easy') ? 12000 : (difficulty === 'medium' ? 8000 : 5000);

        this.updateUI();
        this.nextQuestion();
    }

    nextQuestion() {
        let q = G9_QUESTIONS_POOL[Math.floor(Math.random() * G9_QUESTIONS_POOL.length)];
        this.g9CurrentQ = q;
        this.g9TimeLeft = this.g9MaxTime;

        const questionEl = document.getElementById('g9-question');
        if (questionEl) questionEl.innerText = `"${q.q}"`;

        let options = [
            { t: q.correct, c: true },
            { t: q.wrongs[0], c: false },
            { t: q.wrongs[1], c: false },
            { t: q.wrongs[2], c: false }
        ].sort(() => 0.5 - Math.random());

        for (let i = 0; i < 4; i++) {
            let btn = document.getElementById(`g9-opt${i}`);
            if (btn) {
                btn.innerText = options[i].t;
                btn.dataset.correct = options[i].c ? "true" : "false";
            }
        }

        const controlsEl = document.getElementById('g9-controls');
        if (controlsEl) controlsEl.classList.remove('translate-y-full');
        
        this.g9Phase = 'ASKING';
    }

    g9Answer(idx) {
        if (this.g9Phase !== 'ASKING') return;
        this.g9Phase = 'RESULT';

        const controlsEl = document.getElementById('g9-controls');
        if (controlsEl) controlsEl.classList.add('translate-y-full');

        const btn = document.getElementById(`g9-opt${idx}`);
        let correct = btn && btn.dataset.correct === "true";

        if (correct) {
            this.g9Score += 100000;
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '💸');
        } else {
            this.g9Lives--;
            UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '📉');
            UI.screens.container.classList.add('shake');
            setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
        }

        this.updateUI();

        if (this.g9Lives <= 0) {
            setTimeout(() => UI.endGame("פשיטת רגל!", `סגרת מימון של $${this.g9Score.toLocaleString()}`), 500);
        } else {
            setTimeout(() => this.nextQuestion(), 1500);
        }
    }

    updateUI() {
        const scoreEl = document.getElementById('g9-score');
        const livesEl = document.getElementById('g9-lives');
        if (scoreEl) scoreEl.innerText = this.g9Score.toLocaleString();
        if (livesEl) livesEl.innerText = '❤️'.repeat(this.g9Lives);
    }

    update(dt) {
        if (this.g9Phase === 'ASKING') {
            this.g9TimeLeft -= dt;
            let pct = Math.max(0, (this.g9TimeLeft / this.g9MaxTime) * 100);
            
            const timerBar = document.getElementById('g9-timer-bar');
            if (timerBar) timerBar.style.width = `${pct}%`;

            if (this.g9TimeLeft <= 0) {
                this.g9Phase = 'RESULT';
                const controlsEl = document.getElementById('g9-controls');
                if (controlsEl) controlsEl.classList.add('translate-y-full');

                this.g9Lives--;
                UI.createPopEffect(GameState.canvas.width / 2, GameState.canvas.height / 2, '⏳');
                UI.screens.container.classList.add('shake');
                setTimeout(() => UI.screens.container.classList.remove('shake'), 200);
                
                this.updateUI();

                if (this.g9Lives <= 0) {
                    setTimeout(() => UI.endGame("נגמר הזמן!", `סגרת מימון של $${this.g9Score.toLocaleString()}`), 500);
                } else {
                    setTimeout(() => this.nextQuestion(), 1500);
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.font = '120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let bob = (this.g9Phase === 'ASKING') ? Math.sin(performance.now() / 150) * 10 : 0;
        let emoji = (this.g9Phase === 'ASKING') ? '🕴️' : (this.g9Lives <= 0 ? '🤦‍♂️' : '🤝');
        
        ctx.fillText(emoji, GameState.canvas.width / 2, GameState.canvas.height / 2 - 50 + bob);
        ctx.restore();
    }

    destroy() {
        const controlsEl = document.getElementById('g9-controls');
        if (controlsEl) controlsEl.classList.add('translate-y-full');
    }
}
