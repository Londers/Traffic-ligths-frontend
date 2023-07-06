'use strict';

$(() => {
    $('body').append('<div class="border border-dark mx-1" id="map" ' +
        `style="max-height: 90%; max-width: 100%; position: relative; z-index: 1"></div>`
    )
    // $('html').append(
    //     '<div id="load">' +
    //     '  <div>А</div>' +
    //     '  <div>К</div>' +
    //     '  <div>З</div>' +
    //     '  <div>У</div>' +
    //     '  <div>Р</div>' +
    //     '  <div>Г</div>' +
    //     '  <div>А</div>' +
    //     '  <div>З</div>' +
    //     '</div>'
    // )
    $('html').append('' +
        '<div id="showLoading" class="text-center justify-content-center" ' +
        'style="position: absolute;top: 0px;z-index: 3;width: 100%;height: 100%;background-color: floralwhite;user-select: none;">' +
        '<div id="load">' +
        '  <div>А</div>' +
        '  <div>К</div>' +
        '  <div>З</div>' +
        '  <div>У</div>' +
        '  <div>Р</div>' +
        '  <div>Г</div>' +
        '  <div>А</div>' +
        '  <div>З</div>' +
        '</div>' +
        // '    <h1 style="' +
        // '    position: absolute;' +
        // '    z-index: 3;' +
        // '    top: 45%;' +
        // '    left: 45%;' +
        // '">Загрузка...</h1>' +
        '</div>')
})

ymaps.ready(function () {
    let map;

    let IDs = new Map();
    let areaLayout = [];
    let subareasLayout = [];
    let regionInfo;
    let userRegion;
    let areaInfo;
    let areaZone;
    let fragments;
    let boxRemember = {Y: 0, X: 0};
    let authorizedFlag = false;
    let logDeviceFlag = false;
    let manageFlag = false;
    let techFlag = false;
    let licenseFlag = false;
    let gsFlag = false;
    let xctrlFlag = false;
    let chatFlag = true;
    let fixationFlag = false;
    let ws;

    let circlesMap = new Map();
    let zoom = 19;

    let jumpWasUsed = false;

    //Функция для открытия вкладки
    function openPage(url) {
        window.open(location.origin + '/user/' + localStorage.getItem('login') + url);
    }

    function getRandomColor() {
        let letters = '0123456789A';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 11)];
        }
        return color;
    }

    const about = 'Предназначена для упрощения процедур наблюдения, управления ' +
        'и контроля за работой дорожных контроллеров и другого ' +
        'оборудования, работающего в системе управления дорожным движением.\n\n' +
        'ООО "Автоматика-Д"\n 644042  г. Омск, пр. Карла Маркса, д.18, корпус 28\n' +
        'тел./ тел. +7(3812)39-49-10 \n';

    function openAbout(closeOnExpiration) {
        // Instantiate new modal
        let modal = new Custombox.modal({
            content: {
                effect: 'corner',
                target: '#modal',
                speedIn: 600,
                speedOut: 600,
                onOpen: () => {
                    $('#modal').parent().show();
                },
            },
            overlay: {
                opacity: 0,
                // speedIn: 600,
                // speedOut: 600,
                onClose: () => {
                    $('#modal').parent().hide();
                }
            }
        });
        // Open
        modal.open();
        if (closeOnExpiration) {
            setTimeout(() => $('#modal').parent().trigger('click'), 3000);
        }
    }

    // Создание метки СО для Яндекс карт
    function createPlacemark(trafficLight, layoutCalcFunc, layoutSettings) {
        const placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
            hintContent: `${trafficLight.description}<br>` + `${trafficLight.tlsost.description}<br>` +
                `[${trafficLight.area.num}, ${trafficLight.subarea}, ${trafficLight.ID}, ${trafficLight.idevice}]`
        }, {
            iconLayout: createChipsLayout(function (zoom) {
                // Размер метки будет определяться функией с оператором switch.
                return layoutCalcFunc(zoom);
            }, trafficLight.tlsost.num + layoutSettings),
        });
        //Функция для вызова АРМ нажатием на контроллер
        placemark.events.add('click', function () {
            if (authorizedFlag) {
                handlePlacemarkClick(trafficLight);
            }
        });
        placemark.tf = trafficLight;
        placemark.tf = trafficLight;


        return placemark
    }

    let camerasShown = new Map();
    let allCamsWithZones = new Map();
    let allCamsAngles = new Map();

    $('#camerasLayout').on('change', function (event) {
        if (!event.currentTarget.checked) {
            // Замена меток контроллеров с камерами на метки без камер
            camerasShown.forEach(el => {
                map.geoObjects.set(map.geoObjects.indexOf(el),
                    createPlacemark(el.tf, calculate, getLayoutSettings(el.tf.inputError, false)));
            })
            camerasShown = new Map();
            // Удаление меток камер и углов обзора
            allCamsWithZones.forEach(camWithZones => {
                camWithZones.forEach(cam => map.geoObjects.remove(cam))
            })
            allCamsWithZones = new Map();
            allCamsAngles = new Map();
        } else {
            const [[x1, y1], [x2, y2]] = map.getBounds();
            map.geoObjects.each(function (el) {
                const [[elx, ely]] = el.geometry.getBounds();
                // Проверка меток на попадание в поле зрения оператора
                if (((elx >= x1) && (elx <= x2)) && ((ely >= y1) && (ely <= y2))) {
                    const trafficLight = el.tf;
                    // Нужны только метки светофоров
                    if (el.tf === undefined) return;
                    checkCameras(trafficLight).then(hasCam => {
                        // Проверка наличия камер на картинке перекрёстка
                        if (!hasCam) return;
                        const id = getUniqueId(trafficLight)
                        const placemark = createPlacemark(trafficLight,
                            (zoom => (zoom < 17) ? 50 : 0), getLayoutSettings(trafficLight.inputError, true))

                        // Работа с отображением камер и углов обзора. При zoom 17 и больше создание меток, иначе - удаление
                        if (map.getZoom() >= 17) {
                            if (allCamsWithZones.get(id) === undefined) {
                                const camsWithZones = createCamsWithZones(id, el);
                                camsWithZones.forEach(camPlacemark => {
                                    map.geoObjects.add(camPlacemark)
                                    console.log('add')
                                })
                                allCamsWithZones.set(id, camsWithZones);
                            }
                        } else if (allCamsWithZones.get(id) !== undefined) {
                            allCamsWithZones.get(id).forEach(cam => {
                                map.geoObjects.remove(cam)
                                console.log('remove')
                            })
                            allCamsWithZones.delete(id)
                        }

                        if (camerasShown.get(id) !== undefined) {
                            if (camerasShown.get(id)) return;
                        }

                        // Замена метки контроллера на карте с обычной на метку с камерой
                        map.geoObjects.set(map.geoObjects.indexOf(el), placemark);
                        camerasShown.set(id, placemark)
                        IDs.set(id, placemark)
                    });
                }
            })
        }
    })

    // Условные значения для установки камер относительно центра перекрёстка (географ. коорд.) и угла обзора камер
    const lengthVar = 0.00015;
    const viewingAngle = 30;

    // Создание меток для всех камер и углов их обзора для перекрёстка
    function createCamsWithZones(id, el) {
        const [[elx, ely]] = el.geometry.getBounds();
        const angles = allCamsAngles.get(getUniqueId(el.tf) + 'cam');
        angles.forEach(a => console.log(a))

        const cams = []

        angles.forEach(angle => {
            const camAngleRadians = (angle.cam + 90) * (Math.PI / 180);
            const camDirectionAngle = angle.area;
            const camX = elx + lengthVar * Math.cos(camAngleRadians)
            const camY = ely + lengthVar * Math.sin(camAngleRadians)
            const searchStr = 'Region=' + el.tf.region.num + '&Area=' + el.tf.area.num + '&ID=' + el.tf.ID

            const camPlacemark = new ymaps.Placemark([camX, camY], {
                hintContent: angle.name,
            }, {
                iconLayout: createChipsLayout(function () {
                    return 50;
                }, (el.tf.inputError) ? 'camErr' : 'cam', camDirectionAngle)
            })
            camPlacemark.events.add('click', function () {
                if (authorizedFlag) {
                    localStorage.setItem('cam', angle.name);
                    openPage(`/cameras?` + searchStr);
                }
            });
            // map.geoObjects.add(camPlacemark)
            cams.push(camPlacemark)
            const viewingTriangle = buildCamZone(camX, camY, lengthVar * 2, camDirectionAngle - 90);
            cams.push(viewingTriangle)
            // Adding the polygon to the map.
            // map.geoObjects.add(viewingTriangle);

            // camsWithZones.set()
        })
        return cams;
    }

    // Расчет и создание треугольник для обозначения угла обзора камеры
    function buildCamZone(camX, camY, length, directionAngle) {
        return new ymaps.Polygon([
            /**
             * Specifying the coordinates of the vertices of the polygon.
             * The coordinates of the vertices of the external contour.
             */
            [
                [camX, camY],
                // calculatePointCoords(camX, camY, length, (360 - directionAngle)),
                calculatePointCoords(camX, camY, length, (360 - directionAngle) - (viewingAngle / 2)),
                calculatePointCoords(camX, camY, length, (360 - directionAngle) + (viewingAngle / 2)),
            ],
            // The coordinates of the vertices of the inner contour.
        ], {
            /**
             * Describing the properties of the geo object.
             *  The contents of the balloon.
             */
            hintContent: ''
        }, {
            /**
             * Setting geo object options.
             *  Fill color.
             */
            fillColor: 'rgba(0,255,0,0.15)',
            // The stroke width.
            strokeWidth: 1
        });
    }

    // Расчёт Координат конца отрезка при известных координатах начала, длине отрезка и угле его наклона
    function calculatePointCoords(startX, startY, length, angle) {
        const endX = startX - length * Math.cos(angle * (Math.PI / 180));
        const endY = startY + length * Math.sin(angle * (Math.PI / 180));
        return [endX, endY];
    }

    function checkCameras(trafficLight) {
        return new Promise(function (resolve) {
            let camFlag = false
            $.ajax({
                url: window.location.origin + '/file/static/cross/' + trafficLight.region.num + '/' + trafficLight.area.num + '/' + trafficLight.ID + '/cross.svg',
                type: 'GET',
                success: function (svgData) {
                    // todo Жду обновлённые картинки от Андрея
                    // let x2js = new X2JS();
                    // let data = x2js.xml2json(svgData);
                    // svg.push(data.svg.mphase.phase)

                    $('body').append('<div id="kostil" class="img-fluid" style="display: none" />');
                    $('#kostil').prepend(svgData.children[0].outerHTML.replace('let currentPhase', 'var currentPhase'));

                    if (typeof hasCam === 'function') {
                        camFlag = hasCam()
                        hasCam = undefined

                        if (typeof getAnglesCamera === 'function') {
                            allCamsAngles.set(getUniqueId(trafficLight) + 'cam', getAnglesCamera())
                            getAnglesCamera = undefined
                        }
                    }

                    $('#kostil').remove();
                    resolve(camFlag);
                    // return hasCamFlag;
                },
                error: function (request) {
                    console.log(request.status + ' ' + request.responseText);
                    // alert(JSON.parse(request.responseText).message);
                }
            });
        })
    }

    if (localStorage.getItem('bf') === 'null') localStorage.setItem('bf', '0');
    let antiBruteForceCounter = Number(localStorage.getItem('bf'));
    if (antiBruteForceCounter >= 5) {
        if ((new Date().getTime() - Number(localStorage.getItem('bfts'))) > 15 * 60 * 1000) {
            antiBruteForceCounter = 0;
            localStorage.setItem('bf', '0');
            localStorage.setItem('bfts', null);
            $('#loginButton')[0].disabled = false;
        } else {
            $('#loginButton')[0].disabled = true;
        }
    }

    // $('#workPlace').hide();
    $('#modal').hide();
    $('#switchLayout').parent().hide();
    createEye();
    $('#dropdownControlButton').trigger('click');
    $('#dropdownConnectionButton').trigger('click');
    $('#dropdownMultipleCrossButton').trigger('click');
    $('#dropdownSettingsButton').trigger('click');
    $('#dropdownAdminMenu').trigger('click');
    $('#dropdownHelpButton').trigger('click');
    $('#dropdownLayersButton').trigger('click');
    $('#password').attr('style', 'position: initial;');
    $('#crossesCount').parent().hide();

    // //Для управления закладками
    // localStorage.setItem("maintab", "open");

    // window.onbeforeunload = function () {
    //     localStorage.setItem("maintab", "closed");
    //     sleep(500);
    // };

    $('#changeDialog').show();

    $('#password').on('keyup', function (event) {
        if (event.key === 'Enter') {
            check(true);
        }
    });

    //Открытие личного кабинета
    $('#manageButton').on('click', function () {
        openPage('/manage');
    });

    $('#licenseButton').on('click', function () {
        $.ajax({
            type: 'POST',
            url: location.origin + '/user/' + localStorage.getItem('login') + '/license',
            // data: JSON.stringify(toSend),
            dataType: 'json',
            success: function (data) {
                let date = new Date(data.timeEnd);
                let localDate = date.toLocaleString('ru-RU', {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone});
                $('#license')[0].innerText = 'Организация: ' + data.name + '\nАдрес: ' + data.address +
                    '\nКоличество доступных аккаунтов: ' + data.numAcc + '\nКоличество доступных устройтв: ' +
                    data.numDev + '\nВремя окончания срока действия лицензии:\n' + localDate;
            },
            error: function (request) {
                console.log(request.status + ' ' + request.responseText);
                // alert(JSON.parse(request.responseText).message);
            }
        });

        $('#newLicenseKey').val('');
        $('#licenseDialog').dialog('open');
    });

    if (localStorage.getItem('login') === 'TechAutomatic') {
        $("#exchangeButton").show()
    }
    $('#exchangeButton').on('click', function () {
        // $.ajax({
        //     type: 'POST',
        //     url: location.origin + '/user/' + localStorage.getItem('login') + '/license',
        //     // data: JSON.stringify(toSend),
        //     dataType: 'json',
        //     success: function (data) {
        //         let date = new Date(data.timeEnd);
        //         let localDate = date.toLocaleString('ru-RU', {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone});
        //         $('#license')[0].innerText = 'Организация: ' + data.name + '\nАдрес: ' + data.address +
        //             '\nКоличество доступных аккаунтов: ' + data.numAcc + '\nКоличество доступных устройтв: ' +
        //             data.numDev + '\nВремя окончания срока действия лицензии:\n' + localDate;
        //     },
        //     error: function (request) {
        //         console.log(request.status + ' ' + request.responseText);
        //         // alert(JSON.parse(request.responseText).message);
        //     }
        // });

        $('#newExchangeUser').val('');
        $('#exchangeDialog').dialog('open');
    });

    $('#checkNewLicense').on('click', (e) => {
        e.preventDefault();
        $.ajax({
            type: 'POST',
            url: location.origin + '/user/' + localStorage.getItem('login') + '/license/newToken',
            data: JSON.stringify({keyStr: $('#newLicenseKey').val()}),
            dataType: 'json',
            success: function () {
                $('#licenseDialog').dialog('close');
            },
            error: function (request) {
                $('#newLicenseKey').parent().find('p').remove();
                $('#newLicenseKey').parent().append('<p style="color: red;">' + request.responseJSON.message + '</p>');
                console.log(request.status + ' ' + request.responseText);
                // alert(JSON.parse(request.responseText).message);
            }
        });
    });

    $('#createExchangeUser').on('click', (e) => {
        e.preventDefault();
        $.ajax({
            url: `${location.origin}/user/TechAutomatic/exchange/add`,
            data: JSON.stringify({"login": $('#newExchangeUser').val()}),
            type: "POST",
            success: (data) => {
                $('#showPass').val('Логин: ' + data.login + '\nПароль: ' + data.pass);
                $('#showPass')[0].disabled = true;
                $('#showPassDialog').dialog('open');
                $('#newExchangeUser').val('')
            }
        })
    });

    $('#deleteExchangeUser').on('click', (e) => {
        e.preventDefault();
        $.ajax({
            url: `${location.origin}/user/TechAutomatic/exchange/delete`,
            data: JSON.stringify({"login": $('#exchangeUser').val()}),
            type: "POST",
            success: (e) => {
                alert('Аккаунт успешно удалён')
                $('#exchangeUser').val('')
            }
        })
    });

    //Открытие вкладки с логами устройств
    $('#deviceLogButton').on('click', function () {
        if (jumpWasUsed) localStorage.setItem('jump', $('#region option:selected').text());
        openPage('/deviceLog');
    });

    $('#techArmButton').on('click', function () {
        $('#techDialog').dialog('open');
    });

    $('#alarmButton').on('click', function () {
        (userRegion === '*') ? $('#alarmDialog').dialog('open') : openPage('/alarm?Region=' + userRegion);
    });

    $('#graphButton').on('click', function () {
        openPage('/graphManage?Region=' + 1);
    });

    $('#chatButton').on('click', function () {
        openPage('/chat');
    });

    //Смена пароля текущего аккаунта
    $('#changeButton').on('click', function () {
        $('#oldPassword').val('');
        $('#newPassword').val('');
        $('#repPassword').val('');
        $('#changeDialog').dialog('open');
    });

    //Выбор места для открытия на карте
    $('#locationButton').on('click', function () {
        $('#locationDialog').dialog('open');
    });

    //Выбор фрагмента для открытия на карте
    $('#fragmentButton').on('click', function () {
        makeFragmentSelect('jump');
        $('#fragmentDialog').dialog('open');
    });

    $('#techSuppButton').on('click', function () {
        openPage('/techSupp');
    });

    $('#instructionButton').on('click', function () {
        window.open("/free/resources/АСУДД Микро-М_АРМ_2022.pdf", '_blank')
    });

    $('#aboutButton').on('click', function () {
        openAbout(false);
    });

    //Выбор места для открытия на карте
    $('#loginButton').on('click', function () {
        $('#login').val('');
        $('#password').val('');
        $('#loginDialog').dialog('open');
    });

    //Выход из аккаунта
    $('#logoutButton').on('click', function () {
        if (confirm('Вы уверены?')) {
            ws.send(JSON.stringify({type: 'logOut'}));
        }
    });

    //Логи сервера
    $('#serverLogButton').on('click', function () {
        openPage('/manage/serverLog')
    });

    $('#changeUserButton').on('click', function () {
        $('#login').val('');
        $('#password').val('');
        $('#loginDialog').dialog('open');
    });

    $('#dispatchControlButton').on('click', () => {
        localStorage.setItem('mapSettings', JSON.stringify({bounds: map.getBounds(), zoom: map.getZoom()}))
        openPage('/dispatchControl');
    });

    $('#standardZUButton').on('click', () => {
        localStorage.setItem('mapSettings', JSON.stringify({bounds: map.getBounds(), zoom: map.getZoom()}))
        openPage('/greenStreet');
    });

    $('#arbitraryZUButton').on('click', () => {
        localStorage.setItem('mapSettings', JSON.stringify({bounds: map.getBounds(), zoom: map.getZoom()}))
        openPage('/arbitraryGS');
    });

    $('#charPointsButton').on('click', () => {
        openPage('/charPoints');
    });

    //Проверка валидности пароля
    $('#newPassword').on('input', function () {
        $('#newPasswordMsg').remove();
        if ($('#newPassword').val().length < 6) {
            $('#newPasswordForm').append('<div style="color: red;" id="newPasswordMsg"><h5>Пароль слишком короткий</h5></div>');
        }
    });

    $('#repPassword').on('input', function () {
        $('#repPasswordMsg').remove();
        if (($('#newPassword').val() !== $('#repPassword').val()) && ($('#repPassword') !== '')) {
            $('#repPasswordForm').append('<div style="color: red;" id="repPasswordMsg"><h5>Пароли не совпадают</h5></div>');
        }
    });

    //Окно изменения пароля
    $('#changeDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                if (($('#oldPassword').val() === '') || ($('#newPassword').val() === '') || ($('#repPassword').val() === '')) {
                    if (!($('#oldPasswordMsg').length) && ($('#oldPassword').val() === '')) {
                        $('#oldPasswordForm').append('<div style="color: red;" id="oldPasswordMsg"><h5>Введите старый пароль</h5></div>');
                    }
                    if (!($('#newPasswordMsg').length) && ($('#newPassword').val() === '')) {
                        $('#newPasswordForm').append('<div style="color: red;" id="newPasswordMsg"><h5>Введите новый пароль</h5></div>');
                    }
                    if (!($('#repPasswordMsg').length) && ($('#repPassword').val() === '')) {
                        $('#repPasswordForm').append('<div style="color: red;" id="repPasswordMsg"><h5>Повторите пароль</h5></div>');
                    }
                    return;
                }

                let toSend = {
                    oldPW: $('#oldPassword').val(),
                    newPW: $('#newPassword').val()
                };

                $.ajax({
                    url: location.origin + '/user/' + localStorage.getItem('login') + '/manage/changepw',
                    type: 'POST',
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function (data) {
                        console.log(data.message);
                        $('#changeDialog').dialog('close');
                        alert('Пожалуйста, войдите в систему снова');
                        authorizedFlag = false;
                        manageFlag = false;
                        logDeviceFlag = false;
                        licenseFlag = false;
                        techFlag = false;
                        gsFlag = false;
                        xctrlFlag = false;
                        authorize();
                        // location.href = location.origin;
                    },
                    data: JSON.stringify(toSend),
                    error: function (request) {
                        if (request.responseText.message.includes('Invalid login credentials')) {
                            $('#oldPasswordForm').append('<div style="color: red;" id="oldPasswordMsg"><h5>Неверный пароль</h5></div>');
                        }
                        if (request.responseText.message.includes('Password contains invalid characters')) {
                            $('#newPasswordForm').append('<div style="color: red;" id="newPasswordMsg"><h5>Пароль содержит недопустимые символы</h5></div>');
                        }
                        console.log(request.status + ' ' + request.responseText);
                        // alert(JSON.parse(request.responseText).message);
                    }
                });
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false,
        close: function () {
            $('#oldPasswordMsg').remove();
            $('#newPasswordMsg').remove();
            $('#repPasswordMsg').remove();
            $('#repPasswordMsgNotMatch').remove();
        }
    });

    // Извлечение уникальной связки region-area-id
    function getUniqueId(trafficLight) {
        return trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID;
    }

    //Создание и первичная настройка карты
    // let map = new ymaps.Map('map', {
    map = new ymaps.Map('map', {
        // bounds: [[46.3095967, 36.00983874945198], [56.0082434, 135.112502]],
        center: [54.9912, 73.3685],
        zoom: 19,
    });

    map.events.add(['wheel', 'mousemove', 'click'], function () {
        if ($('#multipleCrossCheck').prop('checked')) circlesControl(map);
    });

    map.events.add(['boundschange'], function () {
        if ($('#camerasLayout')[0].checked) $('#camerasLayout').trigger('change')
    });

    $('#fixationButton').on('click', function () {
        if (fixationFlag) {
            map.setBounds(boxRemember);
        } else {
            boxRemember = map.getBounds();
            $('#fixationButton')[0].innerText = 'Вернуться';
            fixationFlag = true;
        }
    });

    $('#fixationReset').on('click', function () {
        fixationFlag = false;
        $('#fixationButton')[0].innerText = 'Зафиксировать экран';
    });

    $('#switchSubLayout').on('change', function () {
        if ($('#switchSubLayout').prop('checked')) {
            if (subareasLayout.length === 0) createSubareasLayout(map);
        } else {
            if (subareasLayout.length !== 0) deleteSubareasLayout(map);
        }
    });

    $('#switchLayout').on('change', function () {
        if ($('#switchLayout').prop('checked')) {
            if (areaLayout.length === 0) createAreasLayout(map);
        } else {
            if (areaLayout.length !== 0) deleteAreasLayout(map);
        }
    });

    $('#multipleCrossOpen').on('click', function () {
        if ((localStorage.getItem('multipleCross') == null) ||
            (localStorage.getItem('multipleCross') === JSON.stringify([]))) return;

        circlesMap.forEach((value, key) => deleteCircle(map, value, key));
        $('#crossesCount').parent().hide();

        $('#multipleCrossCheck').prop('checked', false);
        openPage('/multipleCross');
    });

    $('#multipleCrossCheck').on('change', function (e) {
        if (!e.target.checked) {
            $('#multipleCrossClear').trigger('click');
        }
    })

    $('#multipleCrossClear').on('click', function () {
        circlesMap.forEach((value, key) => deleteCircle(map, value, key));
        $('#crossesCount').parent().hide();
        localStorage.setItem('multipleCross', JSON.stringify([]));
    });

    $('#addFragmentButton').on('click', function () {
        $('#toolbar').hide();
        $('#createFragmentsBar')[0].hidden = false;
    });

    $('#delFragmentButton').on('click', function () {
        makeFragmentSelect('del');
        $('#fragmentDialog').dialog('open');
    });

    $('#selectFragment').on('click', function () {
        $('#createFragmentDialog').dialog('open');
    });

    $('#backFragment').on('click', function () {
        $('#toolbar').show();
        $('#createFragmentsBar')[0].hidden = true;
    });

    let closeReason = '';
    ws = new WebSocket('wss://' + location.host + '/mapW');

    ws.onopen = function () {
        // on connecting, do nothing but log it to the console
        console.log('connected')
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
        // alert('Ошибка соединения: ' + closeReason);
        setTimeout(() => location.reload(), 2000);
    };

    ws.onerror = function (evt) {
        // alert(`Ошибка соединения WebSocket, ${evt.reason}`);
    }

    // При наличи ошибков входов и/или статистики меняет картинку статуса на картинку с ошибкой
    function getLayoutSettings(inputError, cameras) {
        let layoutSettings = '';

        if (inputError) {
            if (cameras) {
                layoutSettings = 'cdt';
            } else {
                layoutSettings = 'det';
            }
        } else {
            if (cameras) {
                layoutSettings = 'cam';
            }
        }
        return layoutSettings;
    }

    //Функция для обновления статусов контроллеров в реальном времени
    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        console.log(data);
        // localStorage.setItem("maintab", "closed");
        switch (allData.type) {
            case 'mapInfo': {
                $('#showLoading').hide()
                regionInfo = data.regionInfo;
                areaInfo = data.areaInfo;
                userRegion = data.region;
                fragments = data.fragments;
                // let techRegionInfo = (data.region === '*') ? regionInfo : data.region;
                // let techAreaInfo = (data.area === null) ? areaInfo : data.area;
                authorizedFlag = data.authorizedFlag;
                manageFlag = authorizedFlag ? data.access[2] : false;
                logDeviceFlag = authorizedFlag ? data.access[5] : false;
                licenseFlag = authorizedFlag ? data.access[6] : false;
                techFlag = authorizedFlag ? data.access[7] : false;
                gsFlag = authorizedFlag ? data.access[8] : false;
                xctrlFlag = authorizedFlag ? data.access[9] : false;
                if ((areaZone === undefined) && (data.areaZone !== undefined)) {
                    areaZone = data.areaZone;
                    createAreasLayout(map);
                }

                $('#modal')[0].innerText = `АСУДД "Микро-М"\nЛицензия: ${data.license}\nВерсия: 1.00\n\n` + about;
                $('#modal').append('E-mail: <span id="email">p51@inbox.ru</span><br>');
                $('#modal').append('<a href="http://asud55.ru/" target="_blank">http://asud55.ru/</a>');

                const email = $('#email');
                email.on('click', () => {
                    email.select();
                    navigator.clipboard.writeText(email[0].innerText);
                })

                //Заполнение поля выбора регионов для перемещения
                for (let reg in regionInfo) {
                    $('#region').append(new Option(regionInfo[reg], reg));
                }
                fillAreas($('#area'), $('#region'), areaInfo);

                if (techFlag) {
                    makeTech(data, areaInfo);
                }

                // map.controls.remove('searchControl');

                $('#regionForm').on('change', function () {
                    fillAreas($('#area'), $('#region'), areaInfo);
                });

                if ((localStorage.getItem('fragment') ?? '') !== '') {
                    map.setBounds(JSON.parse(localStorage.getItem('fragment')));
                    localStorage.setItem('fragment', '');
                } else {
                    map.setBounds([
                        [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                        [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                    ]);
                }

                zoom = map.getZoom();

                //Разбор полученной от сервера информации
                data.tflight.forEach(trafficLight => {
                    //Создание метки контроллера для карты
                    const placemark = createPlacemark(trafficLight,
                        calculate, getLayoutSettings(trafficLight.inputError, false));
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                    IDs.set(getUniqueId(trafficLight), placemark);
                });
                authorize();
                let reg = regionInfo[data.region];
                let desc = data.description;
                if (authorizedFlag) {
                    $('#workPlace')[0].innerText = 'АСУДД "Микро-М" '
                        + ((data.region === '*') ? 'Все регионы' : ((reg === undefined) ? '' : reg))
                        + '\n' + ((desc === undefined) ? 'АРМ ' : ((data.role === 'Viewer') ? 'АРМ наблюдателя ' : 'АРМ дежурного - ') + data.description)
                        + '\n' + localStorage.getItem('login');
                    openAbout(true);
                }
                break;
            }
            case 'tflight':
                if ((data.tflight === null) || (data.tflight === undefined)) {
                    console.log('error: tflight ', data.tflight);
                } else {
                    console.log('Обновление');
                    if (data.areaZone !== undefined) {
                        areaZone = data.areaZone;
                        deleteSubareasLayout(map);
                        createSubareasLayout(map);
                    }
                    //Обновление статуса контроллера происходит только при его изменении
                    data.tflight.forEach(trafficLight => {
                        const uniqeuId = getUniqueId(trafficLight)
                        const cameras = camerasShown.get(uniqeuId) !== undefined
                        const oldPlacemark = IDs.get(uniqeuId);
                        const placemark = createPlacemark(trafficLight,
                            cameras ? (zoom => (zoom < 17) ? 50 : 0) : calculate,
                            getLayoutSettings(trafficLight.inputError, cameras))
                        //Замена метки контроллера со старым состоянием на метку с новым
                        map.geoObjects.set(map.geoObjects.indexOf(oldPlacemark), placemark);

                        IDs.set(uniqeuId, placemark)
                        if (cameras) {
                            camerasShown.set(uniqeuId, placemark)
                        } else {
                            camerasShown.delete(uniqeuId)
                        }
                    })
                }
                authorize();
                break;
            case 'repaint': {
                let cams = false;
                if ($('#camerasLayout')[0].checked) {
                    $('#camerasLayout').trigger('click');
                    cams = true;
                }
                map.geoObjects.removeAll();
                //Разбор полученной от сервера информации
                data.tflight.forEach(trafficLight => {
                    const uniqeuId = getUniqueId(trafficLight)
                    const cameras = camerasShown.get(uniqeuId) !== undefined
                    //Создание меток контроллеров на карте
                    const placemark = createPlacemark(trafficLight,
                        cameras ? (zoom => (zoom < 17) ? 50 : 0) : calculate,
                        getLayoutSettings(trafficLight.inputError, cameras))
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);

                    IDs.set(uniqeuId, placemark)
                    if (cameras) {
                        camerasShown.set(uniqeuId, placemark)
                    } else {
                        camerasShown.delete(uniqeuId)
                    }
                });
                areaZone = data.areaZone;
                createAreasLayout(map);
                if (cams) {
                    $('#camerasLayout').trigger('click');
                }
                break;
            }
            case 'jump':
                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);
                break;
            case 'login':
                if (data.status && (localStorage.getItem('bf') !== '5')) {
                    localStorage.setItem('multipleCross', JSON.stringify([]));
                    userRegion = data.region;
                    fragments = data.fragments;
                    $('#login').val('');
                    $('#password').val('');
                    document.cookie = ('Authorization=Bearer ' + data.token);
                    if ((localStorage.getItem('login') == null) || (localStorage.getItem('login') === '')) {
                        $.ajax({
                            type: 'POST',
                            url: location.origin + '/user/' + data.login + '/license',
                            // data: JSON.stringify(toSend),
                            dataType: 'json',
                            success: function (data) {
                                $('#modal')[0].innerText = `АСУДД "Микро-М"\nЛицензия: ${data.license}\nВерсия: 1.00\n\n` + about;
                                $('#modal').append('<a href="http://asud55.ru/" target="_blank">http://asud55.ru/</a>');
                                openAbout(true);
                            },
                            error: function (request) {
                                console.log(request.status + ' ' + request.responseText);
                                // alert(JSON.parse(request.responseText).message);
                            }
                        });
                    } else {
                        openAbout(true);
                    }
                    localStorage.setItem('login', data.login);
                    // console.log('QqQqQ', data.areaZone);
                    authorizedFlag = data.authorizedFlag;
                    manageFlag = authorizedFlag ? data.access[2] : false;
                    logDeviceFlag = authorizedFlag ? data.access[5] : false;
                    licenseFlag = authorizedFlag ? data.access[6] : false;
                    techFlag = authorizedFlag ? data.access[7] : false;
                    gsFlag = authorizedFlag ? data.access[8] : false;
                    xctrlFlag = authorizedFlag ? data.access[9] : false;
                    areaZone = data.areaZone;
                    createAreasLayout(map);

                    if (techFlag) {
                        makeTech(data, areaInfo);
                    }

                    $('#loginDialog').dialog('close');
                    chatFlag = true;
                    authorize();
                    $('#workPlace')[0].innerText = 'АСУДД "Микро-М" '
                        + ((data.region === '*') ? 'Все регионы' : regionInfo[data.region])
                        + '\n' + ((data.role === 'Viewer') ? 'АРМ наблюдателя' : 'АРМ дежурного - ')
                        + data.description + '\n' + localStorage.getItem('login');
                    antiBruteForceCounter = 0;
                    localStorage.setItem('bf', '0');
                    localStorage.setItem('bfts', null);
                } else {
                    check(false, data.message);
                    $('#password').val('');
                    if (++antiBruteForceCounter >= 5) {
                        $('.ui-dialog-buttonset:visible button:last').trigger('click');
                        $('#loginButton')[0].disabled = true;
                        alert('Слишком много попыток, попробуйте позже.');
                        localStorage.setItem('bf', antiBruteForceCounter);
                        localStorage.setItem('bfts', JSON.stringify(new Date().getTime()));
                    }
                }
                break;
            case 'logOut':
                // document.cookie = '';
                authorizedFlag = false;
                manageFlag = false;
                logDeviceFlag = false;
                licenseFlag = false;
                techFlag = false;
                gsFlag = false;
                xctrlFlag = false;
                localStorage.setItem('login', '');
                authorize();
                $('#myForm').remove();
                $('.open-button').remove();
                $('#login').val('');
                $('#password').val('');
                deleteAreasLayout(map);
                $('#workPlace')[0].innerText = 'АСУДД "Микро-М" ' + '\nАРМ';
                // if (data.message !== undefined) alert(data.message);
                // location.href = location.origin;
                break;
            case 'checkConn':
                if (data.statusBD !== undefined) {
                    $('#databaseConnection').children().css({
                        'background-color': ((data.statusBD) ? 'green' : 'red')
                    });
                }
                if (data.statusS !== undefined) {
                    $('#serverConnection').children().css({
                        'background-color': ((data.statusS) ? 'green' : 'red')
                    });
                }
                break;
            case 'createFragment':
                if (data.status) {
                    fragments = data.fragment;
                    makeFragmentSelect();
                } else {
                    alert('При создании фрагмента произошла ошибка');
                }
                break;
            case 'deleteFragment':
                if (data.status) {
                    fragments = data.fragment;
                    makeFragmentSelect();
                } else {
                    alert('При создании фрагмента произошла ошибка');
                }
                break;
            case 'error':
                if (data.message.includes('Invalid login credentials')) {
                    if (!($('#passwordMsg').length)) {
                        $('#passwordForm').append('<div style="color: red;" id="passwordMsg"><h5>Неверный логин и/или пароль</h5></div>');
                    }
                } else {
                    closeReason = data.message;
                    ws.close(1000);
                }
                break;
        }
    };

    //Всплывающее окно для создания пользователя /locationButton
    $('#locationDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                //Проверка корректности введённых данных
                if (($('#area option:selected').text() === '')) {
                    if (!($('#areasMsg').length) && ($('#area option:selected').text() === '')) {
                        $('#areasForm').append('<div style="color: red;" id="areasMsg"><h5>Выберите районы</h5></div>');
                    }
                    return;
                }
                let selectedAreas = $('#area option:selected').toArray().map(item => item.value);

                //Сбор данных для отправки на сервер
                let toSend = {
                    type: 'jump',
                    region: $('#region option:selected').val(),
                    area: selectedAreas
                };
                //Отправка данных на сервер
                ws.send(JSON.stringify(toSend));

                jumpWasUsed = true;
                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false,
        close: function () {
            $('#areasMsg').remove();
        }
    });

    $('#techDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                //Проверка корректности введённых данных
                if (($('#techArea option:selected').text() === '')) {
                    if (!($('#techAreasMsg').length) && ($('#techArea option:selected').text() === '')) {
                        $('#techAreasForm').append('<div style="color: red;" id="techAreasMsg"><h5>Выберите районы</h5></div>');
                    }
                    return;
                }
                let selectedAreas = $('#techArea option:selected').toArray().map(item => item.value);

                let region = $('#techRegion option:selected').val();
                let areas = '';
                selectedAreas.forEach(area => {
                    areas += ('&Area=' + area);
                });

                openPage('/techArm?Region=' + region + areas);
                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false,
        close: function () {
            $('#techAreasMsg').remove();
        }
    });

    $('#alarmDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                //Проверка корректности введённых данных
                openPage('/alarm?Region=' + $('#alarmRegion option:selected').val());
                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false
    });

    $('#licenseDialog').dialog({
        autoOpen: false,
        buttons: {
            'Закрыть': function () {
                $(this).dialog('close');
            }
        },
        width: window.screen.width / 3,
        height: window.screen.height / 2,
        modal: true,
        resizable: true,
        close: function () {
            $('#techAreasMsg').remove();
        }
    });

    $('#exchangeDialog').dialog({
        autoOpen: false,
        buttons: {
            'Закрыть': function () {
                $(this).dialog('close');
            }
        },
        width: window.screen.width / 3,
        height: window.screen.height / 2,
        modal: true,
        resizable: true,
        close: function () {
            $('#techAreasMsg').remove();
        }
    });

    $('#showPassDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false,
    });

    $('#loginDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                check(true);
                //     //Проверка корректности введённых данных
                //     if (($('#area option:selected').text() === '')) {
                //         if (!($('#areasMsg').length) && ($('#area option:selected').text() === '')) {
                //             $('#areasForm').append('<div style="color: red;" id="areasMsg"><h5>Выберите районы</h5></div>');
                //         }
                //         return;
                //     }
                //     let selectedAreas = $('#area option:selected').toArray().map(item => item.value);
                //
                //     //Сбор данных для отправки на сервер
                //     let toSend = {
                //         type: 'jump',
                //         region: $('#region option:selected').val(),
                //         area: selectedAreas
                //     };
                //     //Отправка данных на сервер
                //     ws.send(JSON.stringify(toSend));
                //
                //     $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false,
        // close: function () {
        //     $('#areasMsg').remove();
        // }
    });

    $('#createFragmentDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                $('#fragErr').remove()
                if (fragments?.some(fragment => fragment.name === $('#fragmentName').val())) {
                    $('#fragmentName').parent().append('<h6 style="color: red" id="fragErr">Имя фрагмента занято</h6>')
                    return
                }
                ws.send(
                    JSON.stringify({
                        type: 'createFragment',
                        data: {
                            name: $('#fragmentName').val(),
                            bounds: map.getBounds()
                        }
                    })
                );
                $('#fragmentName').val('');
                $(this).dialog('close');
                $('#backFragment').trigger('click');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        modal: true,
        resizable: false
    });

    function makeFragmentSelect(type) {
        const fragmentSelect = $('#fragment');
        $('#fragment option').remove();
        if (fragments ?? false) {
            fragments.forEach(fragment => fragmentSelect.append(new Option(fragment.name, fragment.bounds)))
        } else {
            $('#fragment').append(new Option('Фрагменты отсутствуют', map.getBounds()))
        }
        switch (type) {
            case 'jump':
                $('#fragmentDialog').parent().find('button').filter((i, v) => v.innerText === 'Открыть').show()
                $('#fragmentDialog').parent().find('button').filter((i, v) => v.innerText === 'Открыть в новой вкладке').show()
                $('#fragmentDialog').parent().find('button').filter((i, v) => v.innerText === 'Удалить').hide()
                break;
            case 'del':
                $('#fragmentDialog').parent().find('button').filter((i, v) => v.innerText === 'Открыть').hide()
                $('#fragmentDialog').parent().find('button').filter((i, v) => v.innerText === 'Открыть в новой вкладке').hide()
                $('#fragmentDialog').parent().find('button').filter((i, v) => v.innerText === 'Удалить').show()
                break;
        }
    }

    $('#fragmentDialog').dialog({
        autoOpen: false,
        buttons: {
            'Открыть': function () {
                const [x1, y1, x2, y2] = $('#fragment')[0].value.split(',').map(el => Number(el));
                const bounds = [[x1, y1], [x2, y2]];
                map.setBounds(bounds);

                $(this).dialog('close');
            },
            'Открыть в новой вкладке': function () {
                const [x1, y1, x2, y2] = $('#fragment')[0].value.split(',').map(el => Number(el));
                const bounds = [[x1, y1], [x2, y2]];
                localStorage.setItem('fragment', JSON.stringify(bounds))
                window.open(location.origin);
                $(this).dialog('close');
            },
            'Удалить': function () {
                ws.send(JSON.stringify({type: 'deleteFragment', data: {name: $('#fragment :selected').text()}}))
                $(this).dialog('close');
            },
            'Отмена': function () {
                $(this).dialog('close');
            }
        },
        minWidth: 480,
        modal: true,
        resizable: false
    });

    function authorize() {
        if (!authorizedFlag) {
            $('#loginButton').show();
            $('#logoutButton').hide();
            $('#leftToolbar').hide();
            $('#serverLogButton').hide();
            // $('#DUJournalButton').hide();
            // $('#standardZUButton').hide();
            // $('#arbitraryZUButton').hide();
            // $('#charPointsButton').hide();
            // $('#alarmButton').hide();
            $('#switchLayout').parent().hide();
            $('button[class*="dropdown"]').each(function () {
                $(this).hide();
            })
        } else {
            $('#loginButton').hide();
            $('#logoutButton').show();
            $('#leftToolbar').show();
            $('#serverLogButton').show();
            // $('#DUJournalButton').show();
            // $('#standardZUButton').show();
            // $('#arbitraryZUButton').show();
            // $('#charPointsButton').show();
            // $('#alarmButton').show();
            $('#switchLayout').parent().show();
            $('button[class*="dropdown"]').each(function () {
                $(this).show();
            });
            if (chatFlag) {
                $('body')[0].appendChild($('#chat')[0].content.cloneNode(true));
                chatFlag = false;
            }
        }
        (manageFlag) ? $('#manageButton').show() : $('#manageButton').hide();
        //licenseFlag
        (logDeviceFlag) ? $('#deviceLogButton').show() : $('#deviceLogButton').hide();
        (techFlag) ? $('#techArmButton').show() : $('#techArmButton').hide();
        if (gsFlag) {
            $('#dispatchControlButton').show();
            $('#standardZUButton').show();
            $('#arbitraryZUButton').show();
        } else {
            $('#dispatchControlButton').hide();
            $('#standardZUButton').hide();
            $('#arbitraryZUButton').hide();
        }

        (xctrlFlag) ? $('#charPointsButton').show() : $('#charPointsButton').hide();
        (localStorage.getItem('login') === 'TechAutomatic') ? $('#exchangeButton').show() : $('#exchangeButton').hide();
    }

    let createChipsLayout = function (calculateSize, currnum, rotateDeg) {
        if (currnum === 0) {
            console.log('Возвращен несуществующий статус');
            return null;
        }
        // Создадим макет метки.
        let Chips = ymaps.templateLayoutFactory.createClass(
            '<div class="placemark"  ' +
            'style="background-image:url(\'' + location.origin + '/free/img/trafficLights/' + currnum + '.svg\'); ' +
            `background-size: 100%; transform: rotate(${rotateDeg ? rotateDeg : 0}deg);\n"></div>`, {
                build: function () {
                    Chips.superclass.build.call(this);
                    let map = this.getData().geoObject.getMap();
                    if (!this.inited) {
                        this.inited = true;
                        // Получим текущий уровень зума.
                        let zoom = map.getZoom();
                        // Подпишемся на событие изменения области просмотра карты.
                        map.events.add('boundschange', function () {
                            // Запустим перестраивание макета при изменении уровня зума.
                            let currentZoom = map.getZoom();
                            if (currentZoom !== zoom) {
                                zoom = currentZoom;
                                this.rebuild();
                            }
                        }, this);
                    }
                    let options = this.getData().options,
                        // Получим размер метки в зависимости от уровня зума.
                        size = calculateSize(map.getZoom()),
                        element = this.getParentElement().getElementsByClassName('placemark')[0],
                        // По умолчанию при задании своего HTML макета фигура активной области не задается,
                        // и её нужно задать самостоятельно.
                        // Создадим фигуру активной области "Круг".
                        circleShape = {
                            type: 'Circle',
                            coordinates: [0, 0],
                            radius: size / 2
                        };
                    // Зададим высоту и ширину метки.
                    element.style.width = element.style.height = size + 'px';
                    // Зададим смещение.
                    element.style.marginLeft = element.style.marginTop = -size / 2 + 'px';
                    // Зададим фигуру активной области.
                    options.set('shape', circleShape);
                }
            }
        );
        return Chips;
    };

//Мастшабирование иконов светофороф на карте
    let calculate = function (zoom) {
        switch (zoom) {
//		          case 11:
//		            return 5;
//		          case 12:
//		            return 10;
//		          case 13:
//		            return 20;
            case 14:
                return 30;
            case 15:
                return 35;
            case 16:
                return 50;
            case 17:
                return 60;
            case 18:
                return 80;
            case 19:
                return 130;
            default:
                return 25;
            // return 80;
        }
    };

    function createAreasLayout(map) {
        if (!$('#switchLayout').prop('checked')) return;
        areaZone.forEach(area => {
            let polygon = convexHullTry(map, area.zone, 'Регион: ' + area.region + ', Район: ' + area.area);
            areaLayout.push(polygon);
        })
    }

    function deleteAreasLayout(map) {
        areaLayout.forEach(layout => {
            map.geoObjects.remove(layout);
        });
        areaLayout = [];
    }

    function createSubareasLayout(map) {
        if (!$('#switchSubLayout').prop('checked')) return;
        areaZone.forEach(area => {
            area.sub.forEach(sub => {
                let polygon = convexHullTry(map, sub.zone, 'Регион: ' + area.region + ', Район: ' + area.area + ', Подрайон:' + sub.subArea);
                subareasLayout.push(polygon);
            })
        })
    }

    function deleteSubareasLayout(map) {
        subareasLayout.forEach(layout => {
            map.geoObjects.remove(layout);
        });
        subareasLayout = [];
    }

    function convexHullTry(map, coordinates, description) {
        let color = getRandomColor();
        // Создаем многоугольник, используя вспомогательный класс Polygon.
        let myPolygon = new ymaps.Polygon([
            // Указываем координаты вершин многоугольника.
            // Координаты вершин внешнего контура.
            coordinates.map(point => [point.Y, point.X]),
            // Координаты вершин внутреннего контура.
            [
                [0, 0]
            ]
        ], {
            // Описываем свойства геообъекта.
            // Содержимое балуна.
            hintContent: description
        }, {
            // Задаем опции геообъекта.
            // Цвет заливки.
            fillColor: color,
            fillOpacity: 0.1,
            // Ширина обводки.
            strokeWidth: 5
        });

        // Добавляем многоугольник на карту.
        map.geoObjects.add(myPolygon);
        return myPolygon;
    }

//Заполнение поля выбора регионов для АРМ технолога
    function makeTech(data, techAreaInfo) {
        if (data.region === '*') {
            $('#techRegion option').remove();
            $('#alarmRegion option').remove();
            for (let reg in regionInfo) {
                $('#techRegion').append(new Option(regionInfo[reg], reg));
                $('#alarmRegion').append(new Option(regionInfo[reg], reg));
            }
            fillTechAreas($('#techArea'), $('#techRegion'), areaInfo);
        } else {
            $('#techRegion').append(new Option(regionInfo[data.region], data.region));
            $('#techRegion').prop('disabled', true).val(userRegion).trigger('change');
            fillTechAreas($('#techArea'), $('#techRegion'), techAreaInfo);
        }

        $('#techRegionForm').on('change', function () {
            fillTechAreas($('#techArea'), $('#techRegion'), areaInfo);
        });
    }

//Заполнение поля выбора районов для создания или изменения пользователя
    function fillAreas($area, $region, areaInfo) {
        $area.empty();
        for (let regAreaJson in areaInfo) {
            for (let areaJson in areaInfo[regAreaJson]) {
                if (regAreaJson === $region.find(':selected').text()) {
                    $area.append(new Option(areaInfo[regAreaJson][areaJson], areaJson));
                }
            }
        }
    }

    function fillTechAreas($area, $region, areaInfo) {
        $area.empty();
        let num;
        for (let regAreaJson in areaInfo) {
            for (let areaJson in areaInfo[regAreaJson]) {
                if (regAreaJson === $region.find(':selected').text()) {
                    $area.append(new Option(areaInfo[regAreaJson][areaJson], areaJson));
                }
            }
            num = regAreaJson;
        }
        if (areaInfo === undefined) return;
        if (Object.keys(areaInfo).length === 1) {
            $("#techArea option[value='" + num + "']").prop("selected", true);
            // $area.prop('disabled', true);
        }
    }

    function check(sendFlag, msg) {

        $('#loginMsg').remove();
        $('#passwordMsg').remove();

        if (($('#login').val() === '') || ($('#password').val() === '')) {
            if (!($('#loginMsg').length) && ($('#login').val() === '')) {
                $('#loginForm').append('<div style="color: red;" id="loginMsg"><h5>Введите логин</h5></div>');
            }
            if (!($('#passwordMsg').length) && ($('#password').val() === '')) {
                $('#passwordForm').append('<div style="color: red;" id="passwordMsg"><h5>Введите пароль</h5></div>');
            }
            return;
        }

        if (sendFlag) {
            ws.send(JSON.stringify({
                type: (authorizedFlag ? 'changeAcc' : 'login'),
                login: $('#login').val(),
                password: $('#password').val()
            }));
        } else {
            if (!($('#passwordMsg').length)) {
                $('#passwordForm').append('<div style="color: red;" id="passwordMsg"><h5>' + msg + '</h5></div>');
            }
        }
    }

    function handlePlacemarkClick(trafficLight) {
        const multipleCrossCheck = $('#multipleCrossCheck').prop('checked');
        const camerasFlag = $('#camerasLayout').prop('checked');
        const searchStr = 'Region=' + trafficLight.region.num + '&Area=' + trafficLight.area.num + '&ID=' + trafficLight.ID
        if (multipleCrossCheck) {
            let crossArr = (localStorage.getItem('multipleCross') === null) ? [] : JSON.parse(localStorage.getItem('multipleCross'));
            if (crossArr.length > 5) return;
            if (crossArr.some(cross => ((cross.region === trafficLight.region.num) && (cross.area === trafficLight.area.num) && (cross.id === trafficLight.ID)))) return;
            crossArr.push({region: trafficLight.region.num, area: trafficLight.area.num, id: trafficLight.ID});
            localStorage.setItem('multipleCross', JSON.stringify(crossArr));
            handleClick(map, trafficLight);
            $('#crossesCount').parent().show();
            $('#crossesCount').text(crossArr.length);
        } else if (camerasFlag) {
            checkCameras(trafficLight).then(hasCam => {
                openPage(`/${hasCam ? 'cameras' : 'cross'}?` + searchStr)
            })
        } else {
            openPage('/cross?' + searchStr);
        }
    }

    function createEye() {
//Показать/спрятать пароль
        let bootstrapVersion = 4
        try {
            const rawVersion = $.fn.dropdown.Constructor.VERSION

            // Only try to parse VERSION if is is defined.
            // It is undefined in older versions of Bootstrap (tested with 3.1.1).
            if (rawVersion !== undefined) {
                bootstrapVersion = parseInt(rawVersion, 10)
            }
        } catch (e) {
            // ignore
        }

        const Constants = {
            html: {
                inputGroups: {
                    3: [
                        '<span tabindex="100" class="add-on input-group-addon %s" title="%s">',
                        '</span>'
                    ],
                    4: [
                        '<div class="%s"><button tabindex="100" title="%s" class="btn btn-outline-secondary" type="button">',
                        '</button></div>'
                    ]
                }[bootstrapVersion]
            }
        }

// TOOLS DEFINITION
// ======================

// it only does '%s', and return '' when arguments are undefined
        const sprintf = function (str) {
            const args = arguments
            let flag = true
            let i = 1

            str = str.replace(/%s/g, () => {
                const arg = args[i++]

                if (typeof arg === 'undefined') {
                    flag = false
                    return ''
                }
                return arg
            })
            if (flag) {
                return str
            }
            return ''
        }

        class Password {
            constructor(element, options) {
                this.options = options
                this.$element = $(element)
                this.isShown = false

                this.init()
            }

            init() {
                let placementFuc
                let inputClass

                if (this.options.placement === 'before') {
                    placementFuc = 'insertBefore'
                    inputClass = 'input-group-prepend'
                } else {
                    this.options.placement = 'after' // default to after
                    placementFuc = 'insertAfter'
                    inputClass = 'input-group-append'
                }

                // Create the text, icon and assign
                this.$element.wrap(`<div class="input-group${sprintf(' input-group-%s', this.options.size)}" />`)

                this.$text = $('<input type="text" />')[placementFuc](this.$element)
                    .attr('class', this.$element.attr('class'))
                    .attr('style', this.$element.attr('style'))
                    .attr('placeholder', this.$element.attr('placeholder'))
                    .attr('maxlength', this.$element.attr('maxlength'))
                    .attr('disabled', this.$element.attr('disabled'))
                    .css('display', this.$element.css('display'))
                    .val(this.$element.val()).hide()

                // Copy readonly attribute if it's set
                if (this.$element.prop('readonly'))
                    this.$text.prop('readonly', true)
                this.$icon = $([
                    `${sprintf(Constants.html.inputGroups[0], inputClass, this.options.message)}
      <i class="icon-eye-open ${this.options.eyeClass} ${this.options.eyeClassPositionInside ? '' : this.options.eyeOpenClass}">
      ${this.options.eyeClassPositionInside ? this.options.eyeOpenClass : ''}
      </i>`,
                    Constants.html.inputGroups[1]
                ].join(''))[placementFuc](this.$text).css('cursor', 'pointer')
                // events
                this.$text.off('keyup').on('keyup', $.proxy(function () {
                    if (!this.isShown) return
                    this.$element.val(this.$text.val()).trigger('change')
                }, this))

                this.$icon.off('click').on('click', $.proxy(function () {
                    this.$text.val(this.$element.val()).trigger('change')
                    this.toggle()
                }, this))
            }

            toggle(_relatedTarget) {
                this[!this.isShown ? 'show' : 'hide'](_relatedTarget)
            }

            show(_relatedTarget) {
                const e = $.Event('show.bs.password', {relatedTarget: _relatedTarget})
                this.$element.trigger(e)

                this.isShown = true
                this.$element.hide()
                this.$text.show()
                if (this.options.eyeClassPositionInside) {
                    this.$icon.find('i,svg')
                        .removeClass('icon-eye-open')
                        .addClass('icon-eye-close')
                        .html(this.options.eyeCloseClass)
                } else {
                    this.$icon.find('i,svg')
                        .removeClass(`icon-eye-open ${this.options.eyeOpenClass}`)
                        .addClass(`icon-eye-close ${this.options.eyeCloseClass}`)
                }

                this.$text[this.options.placement](this.$element)
            }

            hide(_relatedTarget) {
                const e = $.Event('hide.bs.password', {relatedTarget: _relatedTarget})
                this.$element.trigger(e)

                this.isShown = false
                this.$element.show()
                this.$text.hide()
                if (this.options.eyeClassPositionInside) {
                    this.$icon.find('i,svg')
                        .removeClass('icon-eye-close')
                        .addClass('icon-eye-open')
                        .html(this.options.eyeOpenClass)
                } else {
                    this.$icon.find('i,svg')
                        .removeClass(`icon-eye-close ${this.options.eyeCloseClass}`)
                        .addClass(`icon-eye-open ${this.options.eyeOpenClass}`)
                }

                this.$element[this.options.placement](this.$text)
            }

            val(value) {
                if (typeof value === 'undefined') {
                    return this.$element.val()
                }
                this.$element.val(value).trigger('change')
                this.$text.val(value)

            }

            focus() {
                this.$element.focus()
            }
        }

        Password.DEFAULTS = {
            placement: 'after', // 'before' or 'after'
            message: 'Click here to show/hide password',
            size: undefined, // '', 'sm', 'large'
            eyeClass: 'fa', // 'glyphicon',
            eyeOpenClass: 'fa-eye', // 'glyphicon-eye-open',
            eyeCloseClass: 'fa-eye-slash', // 'glyphicon-eye-close',
            eyeClassPositionInside: false
        }

// PASSWORD PLUGIN DEFINITION
// =======================

        const old = $.fn.password

        $.fn.password = function () {
            const option = arguments[0] // public function
            const args = arguments
            let value

            const allowedMethods = [
                'show', 'hide', 'toggle', 'val', 'focus'
            ]

            this.each(function () {
                const $this = $(this)
                let data = $this.data('bs.password')
                const options = $.extend({}, Password.DEFAULTS, $this.data(), typeof option === 'object' && option)

                if (typeof option === 'string') {
                    if ($.inArray(option, allowedMethods) < 0) {
                        throw new Error(`Unknown method: ${option}`)
                    }
                    value = data[option](args[1])
                } else {
                    if (!data) {
                        data = new Password($this, options)
                        $this.data('bs.password', data)
                    } else {
                        data.init(options)
                    }
                }
            })

            return value ? value : this
        }

        $.fn.password.Constructor = Password

// PASSWORD NO CONFLICT
// =================

        $.fn.password.noConflict = function () {
            $.fn.password = old
            return this
        }

        $(() => {
            $('[data-toggle="password"]').password()
        })
    }

    function radiusCalculate(zoom) {
        switch (zoom) {
            case 3:
                return 32000;
            case 4:
                return 16000;
            case 5:
                return 8000;
            case 6:
                return 4000;
            case 7:
                return 2000;
            case 8:
                return 1000;
            case 9:
                return 750;
            case 10:
                return 500;
            case 11:
                return 400;
            case 12:
                return 300;
            case 13:
                return 250;
            case 14:
                return 200;
            case 15:
                return 150;
            case 16:
                return 100;
            case 17:
                return 75;
            case 18:
                return 50;
            case 19:
                return 40;
            default:
                return 30;
        }
    }

    function circlesControl(map) {
        if (zoom !== map.getZoom()) {
            circlesMap.forEach(circle => {
                map.geoObjects.remove(circle);
            });
            circlesMap.forEach(circle => {
                circle.geometry.setRadius(radiusCalculate(map.getZoom()));
                map.geoObjects.add(circle);
            });
            zoom = map.getZoom();
        }
    }

    function deleteCircle(map, circle, pos) {
        map.geoObjects.remove(circle);
        circlesMap.delete(pos);
    }

    function handleClick(map, trafficLight) {
        let coordinates = [trafficLight.points.Y, trafficLight.points.X];
        let region = trafficLight.region.num;
        let area = trafficLight.area.num;
        let id = trafficLight.ID;
        let description = trafficLight.description;
        let returnFlag = false;

        circlesMap.forEach((value, key) => {
            if ((key.region === region) && (key.area === area) && (key.id === id)) {
                deleteCircle(map, value, key);
                returnFlag = true;
            }
        });

        if (returnFlag) return;

        // Создаем круг.
        let myCircle = new ymaps.Circle([
            // Координаты центра круга.
            coordinates,
            // Радиус круга в метрах.
            radiusCalculate(map.getZoom())
        ], {
            // Описываем свойства круга.
            // Содержимое балуна.
            // balloonContent: "Радиус круга - 10 км",
            // Содержимое хинта.
            // hintContent: "Подвинь меня"
        }, {
            // Задаем опции круга.
            // Включаем возможность перетаскивания круга.
            draggable: false,
            // Цвет заливки.
            // Последний байт (77) определяет прозрачность.
            // Прозрачность заливки также можно задать используя опцию "fillOpacity".
            fillColor: "#DB709377",
            // Цвет обводки.
            strokeColor: "#990066",
            // Прозрачность обводки.
            strokeOpacity: 0.8,
            // Ширина обводки в пикселях.
            strokeWidth: 5
        });

        circlesMap.set({region: region, area: area, id: id, description: description}, myCircle);

        // Добавляем круг на карту.
        map.geoObjects.add(myCircle);
    }

});
