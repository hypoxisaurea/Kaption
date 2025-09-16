// 확장 프로그램 클릭 시, 사이드 패널 Open
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(function(error) { console.error(error); });

// 설치 시 알림 및 초기 설정
chrome.runtime.onInstalled.addListener(function() {
    console.log("Extension installed.");

    // 알림 생성
    chrome.notifications.create(
        "welcome-notification",
        {
            type: "basic",
            iconUrl: "./logo/logo.png",
            title: "Welcome!",
            message: "Click the extension icon to open the side panel.",
        },
        function() {
            if (chrome.runtime.lastError) {
                console.error("Notification error:", chrome.runtime.lastError.message);
            }
        }
    );
});

chrome.action.onClicked.addListener(function(info, tab) {
    console.log("on click debug!");
});