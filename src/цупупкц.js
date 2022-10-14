function getAnglesCamera() {
    return [
        {
            name: 'ПТЗ - 5',
            cam: 356,
            area: 175,
            ip: 'rtsp://admin:admin@10.38.6.15:554/av0_1',
            controls: {
                stop: 'http://admin:admin@10.38.6.15/cgi-bin/com/ptz.cgi?continuouspantilt=0,0',
                up: 'http://admin:admin@10.38.6.15/cgi-bin/com/ptz.cgi?continuouspantilt=0,5',
                down: 'http://admin:admin@10.38.6.15/cgi-bin/com/ptz.cgi?continuouspantilt=0,-5',
                left: 'http://admin:admin@10.38.6.15/cgi-bin/com/ptz.cgi?continuouspantilt=-20,0',
                right: 'http://admin:admin@10.38.6.15/cgi-bin/com/ptz.cgi?continuouspantilt=20,0'
            }
        }, {
            name: 'Камера 4',
            cam: 156,
            area: 138,
            ip: 'rtsp://admin:admin@10.38.6.14:554/third',
            controls: {stop: '', up: '', down: '', left: '', right: ''}
        }, {
            name: 'Камера 3',
            cam: 335,
            area: 327,
            ip: 'rtsp://admin:admin@10.38.6.11:554/third',
            controls: {stop: '', up: '', down: '', left: '', right: ''}
        }, {
            name: 'Камера 2',
            cam: 351,
            area: 58,
            ip: 'rtsp://admin:admin@10.38.6.13:554/third',
            controls: {stop: '', up: '', down: '', left: '', right: ''}
        },
        {
            name: 'Камера 1',
            cam: 187,
            area: 241,
            ip: 'rtsp://admin:admin@10.38.6.12:554/third',
            controls: {stop: '', up: '', down: '', left: '', right: ''}
        }];
}