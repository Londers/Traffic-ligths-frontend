$(function () {
    const [region, area, ID] = window.location.search.split('&').map(searchItem => searchItem.split('=')[1])

    $('title').text('ДТ ДК-' + ID)

    $.ajax({
        url: window.location.origin + '/file/static/cross/' + region + '/' + area + '/' + ID + '/cross.svg',
        type: 'GET',
        success: function (svgData) {
            $('body').append(svgData.children[0].outerHTML);
            setVisualMode(1);
            $('svg').attr('width', '40%').attr('height', '40%');
            if (typeof getAnglesCamera === "function") {
                const cameras = getAnglesCamera();
                cameras.forEach((camera) => {
                    if (camera.ip.length > 4) {
                        $('body').append(`<a style="margin: 15px; position: fixed" href="http://${camera.ip}/video_ch1" target="_blank">${camera.name}</a>`)
                        // const video = `<img id="video${num}" height="100%" style="-webkit-user-select: none;margin: auto;background-color: hsl(0, 0%, 25%);" src="http://${camera.ip}/video_ch1" alt="Ошибка камеры">`;
                        // $('body').append(video)
                        // $('body').append(`<div><label for="video${num}">camera.name</label>${video}</div>`)
                    }
                })
            }
        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
            alert(JSON.parse(request.responseText).message);
        }
    });

})