# Additional Requirements I Implemented Using AI Assistance

1.这是我的要求 根据这个设计网站：
1. Project Goal
Welcome to your Midterm PA! The goal of this assessment is for you to comprehensively apply your knowledge of Vue.js (Frontend) and Vite (Build Tool) to build a fully functional, responsive, professional, and unique personal brand website from scratch.
This is not just a technical test; it's an opportunity to build an "online portfolio" for yourself. This website will become an important platform for you when applying to college, finding internships, or showcasing your personal projects.
2. Context & Tech Stack
You have mastered key skills in modern web development:
* Vue.js: A progressive JavaScript framework for building dynamic, component-based user interfaces.
* Vite: An extremely fast modern front-end build tool that provides a lightning-fast development experience.
This project requires you to focus on front-end development, using Vue to build all pages and interactions, and Vite to manage your project. All dynamic data (like projects and blog posts) will be loaded from local JSON files rather than an external API.
3. Core Requirements
Your personal website must include the following features. You are free to design the layout and style, but the functionality must be complete.
Your site must include a persistent navigation bar (Navbar) to allow users to easily navigate to all main pages (e.g., Home, Projects, Blog, About Me).
A. Static Content
These pages are primarily for displaying information and are relatively fixed.
1. Homepage:
    * A clear welcome message and a professional avatar or personal logo.
    * A brief self-introduction (who you are, what you do).
    * Quick links to the most important parts of your site (like "Projects" or "Blog").
2. About Me:
    * A more detailed personal story, your academic interests, and your passions.
    * Your personal aspirations/goals.
    * Encouraged to include more photos, a detailed text introduction, and skill tags.
3. Skills/Resume:
    * Skill Set: Clearly display the technologies you have mastered (e.g., Python, JavaScript, Vue, HTML, CSS...). (Bonus: Make it an interactive chart or skill bar).
    * Resume: Your educational background, relevant courses, and awards/achievements.
4. Links:
    * Links to your friends' websites, your favorite learning resources, or developers you admire. Each link should ideally include an icon and a short description.
B. Dynamic Content (JSON-Driven)
These features require asynchronously loading data from local JSON files.
1. Project Portfolio:
    * Must be data-driven using JSON. You will need to create a local JSON file in your project (e.g., public/data/projects.json) and asynchronously load (fetch) it in your Vue component to render the project list.
    * List Page: Display an overview of all your projects (in a card format).
    * Detail Page: Each project should have a detailed description (a project card):
        * Project name and introduction.
        * Screenshots or videos of the project.
        * The technology stack used.
        * Your specific contribution (if it was a team project).
        * Link to the GitHub repository (Required).
        * (Optional) Link to a Live Demo.
    * This page or a related one should also display a list of your main GitHub repositories.
2. Blog/Journal:
    * Must be data-driven from JSON (Read-only). You will need to create another JSON file (e.g., public/data/blog.json) to store your blog posts.
    * (GET) Visitors can view a list of posts and the full post details. Visitors should be able to see the list and click to read the full article.
C. Non-Functional Requirements
1. Responsive Design: The website must display and function well on both desktop and mobile devices.
2. Git & GitHub: All your code must be pushed to GitHub (during development) with a clear commit history.
4. The "AI Assistant" Rule
In this project, you are encouraged to use AI (like Gemini, ChatGPT, Copilot, etc.) as your "pair programmer." AI is a powerful tool, and learning to "harness" it is an essential skill for modern developers.
However, your final grade depends on your "mastery" of the project, not the AI's.
You Should:
* Use AI to learn new concepts (e.g., "How to asynchronously load a local JSON file in Vue?" or "How do dynamic routes work in Vue Router?").
* Use AI to generate boilerplate code (e.g., "Write me a template for a fetch request in Vue").
* Use AI to debug errors (e.g., "My Vue component isn't rendering, here is my code...").
* Use AI to optimize and refactor your code (e.g., "How can I make this function more concise?").
You Must:
1. Understand every line of code you submit. If the AI gives you code you don't understand, you must learn it or not use it.
2. Modify and Adapt. You are strictly prohibited from copy-pasting AI-generated code verbatim into your project. You must:
    * Change it to fit your project's variable and function names.
    * Adapt it to your JSON data structure and component props.
    * Apply your own CSS styles or component library to it.
3. Take responsibility for all your design and technical choices. AI can make mistakes or provide outdated/inefficient solutions.
Assessment Method: During the final presentation, I (the teacher) will randomly select any part of your code and, using your PROMPTS.md file as a reference, ask you to explain it line-by-line, why it's written that way, and how you prompted the AI and modified its answer. If you cannot explain it, that part will be considered incomplete.
5. Deliverables
1. GitHub Repository Link: A public repository containing all your front-end code.
2. Live Demo URL: publish to github.io.
3. PROMPTS.md (Prompts File): (Critical Deliverable) Create a PROMPTS.md file in your repository's root directory. This file must contain all key prompts you used to generate code, debug, or refactor. You do not need to submit the AI's responses.

---

2.Create a modern web developer portfolio with a dark gray/blue background, bright cyan/teal accent color for buttons and links, white or light gray text for readability, and subtle gray and blue highlights for cards, hover effects, and dividers.

3.在home page里面 为什么三个板块view project read blog和learn more 这个view project的颜色需要和另外两个一样 另外导航栏按照 home ,about me, project,blog, skills,links的顺序 然后home的三个板块顺序按照Learn more，view blog 和read blog

4.右上角加一个可以中英切换的功能 切换整个页面的语言

5.那两个svg 图标不要了 换成两个个联系方式 一个是邮箱的小图标 一个是github

6.About me可以加我的个人爱好：足球 篮球 飞盘 电竞 橄榄球 然后点击可以放视频和照片

7.我新建了一个放照片的文件夹 放进照片 我前缀已经改好了

8.Academic Interests和再加一个Featured Courses并列 CL/AP Computer Science A CL/AP Computer Science Principle
CL Applied Python Programming, Information and Communication Technology
CL/AP Statistic
CL/AP Physics C: Mechanics
CL/AP Calculus BC

9.Web Development
Building responsive and interactive web applications using modern frameworks and technologies.

User Experience
Creating intuitive and user-friendly interfaces that provide exceptional user experiences.

Software Engineering
Applying best practices in software design, architecture, and development methodologies.

Data Structures
Understanding and implementing efficient algorithms and data structures for optimal performance.只用写三个就好：Human-Computer Interaction，data science, AI

10.就叫Honors & Awards 然后按年级来排序 12在最上面 如果想同年级 按照番位来排序 international在最上面 然后每个hoboy加一句click to view

11.skills属性卡那样的展示形式吧这些都展示出来

12.Technical Skills板块里面Level Mastery Advanced这几个词语在切换到中文的时候翻译成中文

13.在about me板块里面 把Featured Courses和Personal Aspirations & Goals掉换一个位置 然后把featured courses改成Personal Interests 然后在里面放上几个小图标 标志就在public文件夹的Interest里面

14.Personal Aspirations & Goals和My Hobbies前面也要加上小图标 然后Personal Interests里面的小图标可以大一点 还有很多空白没用到 可以三个一行 排两行

15.Personal Aspirations & Goals和My Hobbies的字体颜色要和Academic Interests这个一致 然后My Hobbies前面的小图标不要和interest的重复

16.回到skills板块在每次进入skills时 Technical Skills里面的level进度条都有一个动态的伸展到相应的值

17.然后education backround再点击中文后也要全部翻译成中文

18.帮我编辑第一个projects：Designed Java-based "Soccer Card Draw" game: implemented randomized card mechanics, optimized code via method variations, and mastered algorithms/data structures to ensure smooth functionality.

19.点进详情之后都不能向下滑动观看任何东西 就被固定在原地了 封面底下不需要详细介绍项目

20.第一个项目的链接：@https://github.com/Ymm0709/Soccer-Card-Draw-Game

21.每个项目的screenshot都放在Technologies Used下面

22.给project封面上的github换成深色的

23.这个没有github 但是有一个link：@http://hsapp.yungu.org/tour/ 你放这个吧 把github换掉

24.Life demo换成more 然后project里面的links里面把github去掉好了

25.按时间顺序来排 2025在最上面

26.把所有links按照顺序排好呀 不要出现一行空出来最后一个这种

27.顶部不要留白

28.project里面也需要中文翻译

29.about me那里的我的爱好 每一个图标下面不都是有click to view吗 点击中文的翻译的时候这个也要翻译成点击查看

30.“My Hobbies”和“Personal Aspirations & Goals”还是白色的颜色字体 你要改成“Academic Interests”的颜色字体