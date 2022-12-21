; (function () {

    function domainRoot(){
        return 'https://www.backerkit.com';
    }

    function insertIframe(url, prependTarget) {
        if (url.indexOf('/projects') === -1) {
            return
        }
        var parser = document.createElement('a');
        parser.href = url;


        $('<iframe>', { src: domainRoot() + parser.pathname + '/iframe', frameBorder: "0", scrolling: 'no', style:'height:435px;' + "width:" + prependTarget.width() + "px; margin:10px auto; "}).prependTo(prependTarget);
    }

    function doKickstarter() {
        var url = $("*[rel='canonical']").first().attr('href'),
            prependTarget = $('.NS_projects__hero_funding .container-flex, .NS_projects__hero_spotlight .container-flex, .NS_projects__content').first();

        if (url === undefined) {
            return;
        }
        if (url.indexOf('creator_bio') !== -1) {
            return;
        }
        url = url.replace('/creator_bio');

        var surveyIframe = $('<iframe>', { src: domainRoot() + '/master_backer_accounts/iframe', frameBorder: "0", style:'display:none;', width: '100%', height: '40px', scrolling: 'no', id:'bk-survey-iframe' })
        surveyIframe.prependTo($('body'));

        window.addEventListener("message", function (event) {
            if(event.origin.indexOf('www.backerkit.') === -1)
                return
               
            var showIframe = event.data.split(':')[1]
            if(showIframe == 'true')
                surveyIframe.hidden = false
        }, false);

        setTimeout(function(){
            surveyIframe[0].contentWindow.postMessage("hello there!", domainRoot());
        }, 2000)


        insertIframe(url, prependTarget);
    };

    function doIndiegogo() {
        var url = $("*[rel='canonical']").first().attr('href').split('/x/')[0],
            prependTarget = $('.campaignLayout-midContent');
        insertIframe(url, prependTarget);
    };

    function doBackerKit(){
        var metadata = document.querySelector('meta[name="backertracker-canonical"]')

        if(metadata){
            var url = metadata.dataset.url,
                prependTarget = metadata.dataset.target;
                insertIframe(url, $('#' + prependTarget));
        }
    }

    var href = location.href;

    if (href.indexOf('kickstarter.com') !== -1) {
        doKickstarter();
    } else if (href.indexOf('backerkit.com/c') !== -1 || href.indexOf('backerkit.test/c') !== -1) {
        doBackerKit();        
    } else {
        doIndiegogo();
    }
})();
