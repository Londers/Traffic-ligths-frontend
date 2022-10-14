$(function () {
    const [region, area, ID] = window.location.search.split('&').map(searchItem => searchItem.split('=')[1])

    $('title').text('ДТ ДК-' + ID)
    $.ajax({
        url: window.location.origin + '/file/static/cross/' + region + '/' + area + '/' + ID + '/cross.svg',
        type: 'GET',
        success: function (svgData) {
            $('body').append(`<div id="svg" style="position: absolute; width: 500px; height: 500px">${svgData.children[0].outerHTML}</div>`);
            setVisualMode(1);
            $('svg').attr('width', '100%').attr('height', '100%');
            $('#svg').draggable().resizable({aspectRatio: true});
            $('body').prepend('<div id="buttons"></div>')
            if (typeof getAnglesCamera === "function") {
                const cameras = getAnglesCamera();
                cameras.forEach((camera, id) => {
                    if (camera.ip.length > 4) {
                        const ip = `${location.origin}/stream?camera=${camera.ip}`
                        let cameraDiv = `<div id="cam${id}" style="position:absolute; top: 554px;">` +
                            `<img class="resizable" style="width: 480px; height: 270px; display: block; 
                            background-color: gray; text-align: center;" 
                            src="${ip}" alt="Видео недоступно">`
                        // src="${location.origin}/stream?camera=${camera.ip}" alt="Видео недоступно"></div>`
                        $('#buttons').prepend(`<button id="btn${id}" class="btn btn-secondary m-2" style="height: 50%;">${camera.name}</button>`);

                        if ((camera.controls !== undefined) && camera.controls.stop !== '') {
                            cameraDiv += '<div class="controls">'
                            for (const [command, url] of Object.entries(camera.controls)) {
                                cameraDiv += `<button onclick="$.ajax({url: '${location.origin}/cameras/control?command=${url}', type: 'GET'})">${translate(command)}</button>`
                            }
                            cameraDiv += '</div>'
                        }
                        cameraDiv += '</div>'
                        $('#btn' + id).on('click', () => cameraControl(cameraDiv, ip, camera.name, id));
                        if (localStorage.getItem('cam') === camera.name) {
                            $('#btn' + id).trigger('click');
                            localStorage.removeItem('cam')
                        }
                    }
                })
            }
        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
            // alert(JSON.parse(request.responseText).message);
        }
    });

    function cameraControl(camera, ip, name, id) {
        const camDiv = $('#cam' + id);
        if (camDiv.length === 0) {
            $('body').append(camera);
            $('.resizable').resizable({aspectRatio: 16 / 9});
            // $('.resizable').parent().draggable();
            // $('.controls').draggable();
            $('#cam' + id).draggable()
            $($('#cam' + id).children()[0]).prepend(`<div style="position: absolute; color: white; background-color: black; font-size: large;">${name}</div>`)
        } else if (!camDiv[0].hidden) {
            $(camDiv).find('img').attr('src', '')
            $(camDiv).hide()
            camDiv[0].hidden = true
        } else {
            $(camDiv).find('img').attr('src', ip)
            $(camDiv).show()
            camDiv[0].hidden = false
        }
    }
})

function translate(command) {
    switch (command) {
        case "stop": return "Остановить"
        case "up": return "Вверх"
        case "down": return "Вниз"
        case "left": return "Налево"
        case "right": return "Направо"
    }
    return ""
}