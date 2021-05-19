$(function () {
    const ID = localStorage.getItem('ID')
    const area = localStorage.getItem('area')
    const region = localStorage.getItem('region')

    $('title').text('ДТ ДК-' + ID)

    $.ajax({
        url: window.location.origin + '/file/static/cross/' + region + '/' + area + '/' + ID + '/cross.svg',
        type: 'GET',
        success: function (svgData) {
            $('body').append(svgData.children[0].outerHTML);
            setVisualMode(1)
            $('svg').attr('width', '40%').attr('height', '40%')
        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
        }
    });

})