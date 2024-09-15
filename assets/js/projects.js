const projects = [
    {
        title: "Repair App",
        image: "assets/img/cpr-thumbnail.png",
        link: "websites/cpr/index.html",
        description: "A web application for managing repair jobs.",
    },
    {
        title: "Kame House",
        image: "assets/img/kamehouse-thumbnail.png",
        link: "websites/kamehouse/index.html",
        description: "A community website for Kame House enthusiasts.",
    },
    {
        title: "Honey Do Helper",
        image: "assets/img/honeydo-thumbnail.png",
        link: "websites/honeydo/index.html",
        description: "A helper app for managing household tasks.",
    },
    {
        title: "Business App",
        image: "assets/img/qmp-thumbnail.png",
        link: "websites/bma/index.html",
        description: "An app designed for business management.",
    },
    {
        title: "Your Tech Guy",
        image: "assets/img/ytg-thumbnail.png",
        link: "websites/ytg/index.html",
        description: "Tech support and services website.",
    },
    {
        title: "Gallery",
        image: "assets/img/gdg-thumbnail.png",
        link: "websites/gdg/index.html",
        description: "A gallery showcasing various images.",
    },
    {
        title: "SES",
        image: "assets/img/ses-thumbnail.png",
        link: "websites/ses/index.html",
        description: "Smart Electronics Solutions LLC website.",
    },
    {
        title: "Gaming",
        image: "assets/img/game-thumbnail.png",
        link: "websites/game/index.html",
        description: "A website dedicated to gaming content.",
    },
    {
        title: "Minecraft Server",
        image: "assets/img/khmc-thumbnail.png",
        link: "websites/khmc/index.html",
        description: "A Minecraft server community site.",
    },
    {
        title: "Luis Solutions",
        image: "assets/img/ls-thumbnail.png",
        link: "websites/ls/index.html",
        description: "IT solutions service website.",
    },
];

const apps = [
    {
        title: "Blackjack",
        image: "assets/img/blackjack-thumbnail.png",
        link: "apps/blackjack.html",
        description: "Play a classic game of Blackjack.",
    },
    {
        title: "Calculator",
        image: "assets/img/calc-thumbnail.png",
        link: "apps/calc.html",
        description: "A simple and efficient calculator app.",
    },
    {
        title: "Cheat Sheet",
        image: "assets/img/cheatsheet-thumbnail.png",
        link: "apps/cheatsheet.html",
        description: "Access quick references and cheat sheets.",
    },
    {
        title: "Chess",
        image: "assets/img/chess-thumbnail.png",
        link: "apps/chess.html",
        description: "Challenge yourself with a game of chess.",
    },
    {
        title: "Contact Manager",
        image: "assets/img/contact-thumbnail.png",
        link: "apps/contact.html",
        description: "Manage your contacts efficiently.",
    },
    {
        title: "Unit Converter",
        image: "assets/img/conversion-thumbnail.png",
        link: "apps/conversion.html",
        description: "Convert units across various measurement systems.",
    },
    {
        title: "Format Converter",
        image: "assets/img/converting-thumbnail.png",
        link: "apps/converting.html",
        description: "Convert one format to another.",
    },
    {
        title: "Wire Tracking",
        image: "assets/img/count-thumbnail.png",
        link: "apps/count.html",
        description: "A simple counter app for tracking counts.",
    },
    {
        title: "Info Hub",
        image: "assets/img/info-thumbnail.png",
        link: "apps/info.html",
        description: "Access a hub of useful information.",
    },
    {
        title: "Online Chess",
        image: "assets/img/livechess-thumbnail.png",
        link: "apps/livechess.html",
        description: "Play chess live with others online.",
    },
    {
        title: "Live Registration",
        image: "assets/img/livereg-thumbnail.png",
        link: "apps/livereg.html",
        description: "Register for events with live confirmation.",
    },
    {
        title: "Online Math Game",
        image: "assets/img/livemathgame-thumbnail.png",
        link: "apps/livemathgame.html",
        description: "Play math games with live scoring.",
    },
    {
        title: "Local Budget",
        image: "assets/img/localbudget-thumbnail.png",
        link: "apps/localbudget.html",
        description: "Manage your budget locally.",
    },
    {
        title: "Local Gallery",
        image: "assets/img/localgallery-thumbnail.png",
        link: "apps/localgallery.html",
        description: "Browse a local image gallery.",
    },
    {
        title: "Local Gas Tracker",
        image: "assets/img/localgas-thumbnail.png",
        link: "apps/localgas.html",
        description: "Track gas usage locally.",
    },
    {
        title: "Local Inventory",
        image: "assets/img/localinventory-thumbnail.png",
        link: "apps/localinventory.html",
        description: "Manage local inventory data.",
    },
    {
        title: "Local Mileage Tracker",
        image: "assets/img/localmileage-thumbnail.png",
        link: "apps/localmileage.html",
        description: "Track mileage locally.",
    },
    {
        title: "Local Timer",
        image: "assets/img/localtimer-thumbnail.png",
        link: "apps/localtimer.html",
        description: "Use a timer without internet connectivity.",
    },
    {
        title: "Math Game",
        image: "assets/img/mathgame-thumbnail.png",
        link: "apps/mathgame.html",
        description: "Challenge yourself with math games.",
    },
    {
        title: "Mouse Game",
        image: "assets/img/mousegame-thumbnail.png",
        link: "apps/mousegame.html",
        description: "Test your reflexes in this mouse game.",
    },
    {
        title: "Password Generator",
        image: "assets/img/password-thumbnail.png",
        link: "apps/password.html",
        description: "Generate secure passwords.",
    },
    {
        title: "Percentage Calculator",
        image: "assets/img/percent-thumbnail.png",
        link: "apps/percent.html",
        description: "Calculate percentages easily.",
    },
    {
        title: "Timer",
        image: "assets/img/timer-thumbnail.png",
        link: "apps/timer.html",
        description: "A simple countdown and stopwatch timer.",
    },
    {
        title: "Viewer",
        image: "assets/img/viewer-thumbnail.png",
        link: "apps/viewer.html",
        description: "View files and documents.",
    },
    {
        title: "Online Mileage Tracker",
        image: "assets/img/livemileage-thumbnail.png",
        link: "apps/livemileage.html",
        description: "Track mileage with live data updates.",
        requiresLogin: true,
    },
    {
        title: "Budget Tracker",
        image: "assets/img/budget-thumbnail.png",
        link: "apps/budget.html",
        description: "Manage your finances with this budget tracker.",
        requiresLogin: true,
    },
    {
        title: "Gas Tracker",
        image: "assets/img/gas-thumbnail.png",
        link: "apps/gas.html",
        description: "Track your fuel usage and expenses.",
        requiresLogin: true,
    },
    {
        title: "Invoice Generator",
        image: "assets/img/invoice-thumbnail.png",
        link: "apps/invoice.html",
        description: "Create professional invoices quickly.",
        requiresLogin: true,
    },
    {
        title: "Learning App",
        image: "assets/img/learn-thumbnail.png",
        link: "apps/learn.html",
        description: "An app to facilitate learning new topics.",
        requiresLogin: true,
    },
    {
        title: "Useful Links",
        image: "assets/img/links-thumbnail.png",
        link: "apps/links.html",
        description: "A collection of useful links and resources.",
        requiresLogin: true,
    },
    {
        title: "Live Analytics",
        image: "assets/img/liveanalytics-thumbnail.png",
        link: "apps/liveanalytics.html",
        description: "View real-time analytics data.",
        requiresLogin: true,
    },
    {
        title: "Online Budgeting",
        image: "assets/img/livebudget-thumbnail.png",
        link: "apps/livebudget.html",
        description: "Manage your budget with live updates.",
        requiresLogin: true,
    },
    {
        title: "Live Chat",
        image: "assets/img/livechat-thumbnail.png",
        link: "apps/livechat.html",
        description: "Communicate in real-time with live chat.",
        requiresLogin: true,
    },
    {
        title: "Online Database",
        image: "assets/img/livedatabase-thumbnail.png",
        link: "apps/livedatabase.html",
        description: "Interact with a live database system.",
        requiresLogin: true,
    },
    {
        title: "Online Gallery",
        image: "assets/img/livegallery-thumbnail.png",
        link: "apps/livegallery.html",
        description: "Browse a gallery of images in real-time.",
        requiresLogin: true,
    },
    {
        title: "Online Gas Tracker",
        image: "assets/img/livegas-thumbnail.png",
        link: "apps/livegas.html",
        description: "Track gas usage with live data updates.",
        requiresLogin: true,
    },
    {
        title: "Online Inventory",
        image: "assets/img/liveinventory-thumbnail.png",
        link: "apps/liveinventory.html",
        description: "Manage inventory with live tracking.",
        requiresLogin: true,
    },
    {
        title: "Online Invoice",
        image: "assets/img/liveinvoice-thumbnail.png",
        link: "apps/liveinvoice.html",
        description: "Generate invoices with live data integration.",
        requiresLogin: true,
    },
    {
        title: "Online Testing",
        image: "assets/img/livelearn-thumbnail.png",
        link: "apps/livelearn.html",
        description: "Engage in live learning sessions.",
        requiresLogin: true,
    },
    {
        title: "Online Links",
        image: "assets/img/livelinks-thumbnail.png",
        link: "apps/livelinks.html",
        description: "Access live updates of useful links.",
        requiresLogin: true,
    },
    {
        title: "Online Notes",
        image: "assets/img/livenotes-thumbnail.png",
        link: "apps/livenotes.html",
        description: "Take and share notes in real-time.",
        requiresLogin: true,
    },
    {
        title: "Online Task Manager",
        image: "assets/img/livetasker-thumbnail.png",
        link: "apps/livetasker.html",
        description: "Manage tasks with live collaboration.",
        requiresLogin: true,
    },
    {
        title: "Online Timer",
        image: "assets/img/livetimer-thumbnail.png",
        link: "apps/livetimer.html",
        description: "Use a timer with live synchronization.",
        requiresLogin: true,
    },
    {
        title: "Mileage Tracker",
        image: "assets/img/mileage-thumbnail.png",
        link: "apps/mileage.html",
        description: "Keep track of your travel mileage.",
        requiresLogin: true,
    },
    {
        title: "Notes",
        image: "assets/img/notes-thumbnail.png",
        link: "apps/notes.html",
        description: "Create and manage your notes.",
        requiresLogin: true,
    },
    {
        title: "Task Manager",
        image: "assets/img/tasker-thumbnail.png",
        link: "apps/tasker.html",
        description: "Organize and track your tasks.",
        requiresLogin: true,
    },
];
