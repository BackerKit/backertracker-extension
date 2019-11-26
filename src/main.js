; (function () {

    function insertIframe(url, prependTarget) {
        if (url.indexOf('/projects') === -1) {
            return
        }
        var parser = document.createElement('a');
        parser.href = url;

        $('<iframe>', { src: 'https://www.backerkit.com' + parser.pathname + '/iframe', frameBorder: "0", width: prependTarget.width(), height: '360px', scrolling: 'no' }).prependTo(prependTarget);
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

        $('<iframe>', { src: 'https://www.backerkit.com/master_backer_accounts/iframe', frameBorder: "0", width: '100%', height: '40px', scrolling: 'no' }).prependTo($('body'));

        insertIframe(url, prependTarget);
    };

    function doIndiegogo(){
        var url = $("*[rel='canonical']").first().attr('href').split('/x/')[0],
            prependTarget = $('.campaignLayout-midContent');
        insertIframe(url, prependTarget);
    };

    if (location.host.indexOf('kickstarter') === -1) {
        doIndiegogo();
    } else {
        doKickstarter();
    }
})();
