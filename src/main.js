; (function () {

    function domainRoot(){
        return 'https://www.backerkit.com';
    }

    function canonicalUrl(){
        return document.querySelector("*[rel='canonical']").href
    }

    function insertIframe(url, prependTarget) {
        if (url.indexOf('/projects') === -1) {
            return
        }
        var parser = document.createElement('a');
        
        parser.href = url;

        var iframe =  document.createElement('iframe');

        iframe.src =  domainRoot() + parser.pathname + '/iframe';
        iframe.frameBorder =  "0";
        iframe.scrolling =  'no';
        iframe.style = 'height: 435px; ' + 'width: ' + prependTarget.offsetWidth + 'px; margin:10px auto; ';
        prependTarget.prepend(iframe)
    }

    function doKickstarter() {

        var url = canonicalUrl(),
            prependTarget = document.querySelector('.NS_projects__hero_funding .container-flex, .NS_projects__hero_spotlight .container-flex, .NS_projects__content');

        if (url === undefined) {
            return;
        }
        if (url.indexOf('creator_bio') !== -1) {
            return;
        }
        url = url.replace('/creator_bio');
        
        insertIframe(url, prependTarget);

        // var surveyIframe =  document.createElement('iframe')
        
        // surveyIframe.src =  domainRoot() + '/users/iframe';
        // surveyIframe.frameBorder =  "0";
        // surveyIframe.scrolling =  'no';
        // surveyIframe.style = 'width:100%; height:40px';
        // surveyIframe.id = 'bk-survey-iframe'
        // document.body.prepend(surveyIframe);
            
        // window.addEventListener("message", function (event) {
        //     if(event.origin.indexOf('www.backerkit.') === -1)
        //         return
               
        //     var showIframe = event.data.split(':')[1]
        //     if(showIframe == 'true')
        //         surveyIframe.hidden = false
        // }, false);

        // setTimeout(function(){
        //     surveyIframe[0].contentWindow.postMessage("hello there!", domainRoot());
        // }, 2000)

    };

    function doIndiegogo() {
        var url = canonicalUrl().split('/x/')[0],
            prependTarget = document.querySelector('.campaignLayout-midContent');
        insertIframe(url, prependTarget);
    };

    function doBackerKit(){
        var metadata = document.querySelector('meta[name="backertracker-canonical"]')

        if(metadata){
            var url = metadata.dataset.url,
                prependTarget = document.querySelector( "#" + metadata.dataset.target);
                insertIframe(url, prependTarget);
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
