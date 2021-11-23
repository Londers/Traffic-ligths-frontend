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
                        const cameraDiv = `<div id="cam${id}" style="position:absolute; top: 554px;">` +
                            `<img class="resizable" style="width: 480px; height: 270px; display: block; 
                            background-color: gray; text-align: center;" 
                            src="${location.origin}/stream?camera=${camera.ip}" alt="Видео недоступно"></div>`
                        $('#buttons').prepend(`<button id="btn${id}" class="btn btn-secondary m-2" style="height: 50%;">${camera.name}</button>`);
                        $('#btn' + id).on('click', () => cameraControl(cameraDiv, camera.name, id));
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
            alert(JSON.parse(request.responseText).message);
        }
    });

    function cameraControl(camera, name, id) {
        const camDiv = $('#cam' + id);
        if (camDiv.length === 0) {
            $('body').append(camera);
            $('.resizable').resizable({aspectRatio: 16 / 9});
            $('.resizable').parent().draggable();
            $('#cam' + id).children().prepend(`<div style="position: absolute; color: white; background-color: black; font-size: large;">${name}</div>`)
        } else {
            camDiv.remove();
        }
    }
})