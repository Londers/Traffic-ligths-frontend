const setPhases = [];
var setPhase = undefined;

$(function () {
    const crosses = JSON.parse(localStorage.getItem('multipleCross'));

    if (crosses.length === 0) {
        alert('Нет выбранных перекрёстков!');
        window.close();
    }

    crosses.forEach((cross, i) => {
        $.ajax({
            url: window.location.origin + '/file/static/cross/' + cross.region + '/' + cross.area + '/' + cross.id + '/cross.svg',
            type: 'GET',
            success: function (svgData) {
                // todo Жду обновлённые картинки от Андрея
                const kostil = 'function setPhase(phase){';

                const svgId = cross.region + cross.area + cross.id;
                let outerHTML = svgData.children[0].outerHTML;
                let setPhaseStart = outerHTML.indexOf(kostil) + kostil.length;

                outerHTML = outerHTML.slice(0, setPhaseStart) + outerHTML.slice(setPhaseStart).replace('};', '');
                outerHTML = outerHTML.replace(kostil, '');

                let scriptStart = outerHTML.indexOf('<script>') + 8;
                let scriptEnd = outerHTML.indexOf('</script>');

                outerHTML = outerHTML.slice(0, scriptStart) + kostil + outerHTML.slice(scriptStart, scriptEnd) + '};' + outerHTML.slice(scriptEnd);

                const $block = $('#block' + (i + 1));

                $block.attr('style', 'display: block;');
                $block.append(outerHTML
                    .replaceAll('document.', `document.getElementById('${svgId}').`));
                $(`#block${i + 1} svg`).attr('id', svgId);

                $('#' + svgId).attr('width', window.innerHeight * 0.45);

                $(window).resize(() => $('#' + svgId).attr('width', window.innerHeight * 0.45));

                if (setPhase !== undefined) {
                    let setPhaseFunc = setPhase.bind({});
                    setPhase = undefined;
                    setPhases.push({blockId: i + 1, func: setPhaseFunc});

                    const ws = new WebSocket(`wss://${location.host}/user/${localStorage.getItem('login')}/crossW?Region=${cross.region}&Area=${cross.area}&ID=${cross.id}`);
                    ws.onopen = function () {
                        console.log('connected', svgId);
                    };

                    ws.onclose = function (evt) {
                        console.log('disconnected', evt);
                    };

                    ws.onmessage = function (evt) {
                        let allData = JSON.parse(evt.data);
                        let data = allData.data;
                        console.log(svgId, allData);
                        switch (allData.type) {
                            case 'crossBuild':
                                $(`#block${i + 1} h4`).html(data.state.name);
                                setPhases.forEach(setter => {
                                    if (setter.blockId === i + 1) setter.func(data.dk.fdk)
                                });
                                break;
                            case 'phase':
                                setPhases.forEach(setter => {
                                    if (setter.blockId === i + 1) {
                                        console.log(svgId + '-' + data.dk.fdk);
                                        setter.func(data.dk.fdk)
                                    }
                                });
                                break;
                            case 'close':
                                ws.close();
                                window.close();
                                break;
                        }
                    }
                }
            },
            error: function (request) {
                console.log(request.status + ' ' + request.responseText);
            }
        });
    });

    window.onbeforeunload = function() {
        localStorage.setItem('multipleCross', JSON.stringify([]));
    }
});