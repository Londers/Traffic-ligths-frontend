'use strict';

let currnum = -1;
let IDs = [];
let areaLayout = [];
let subareasLayout = [];
let regionInfo;
let areaInfo;
let areaZone;
let boxRemember = {Y: 0, X: 0};
// let login = '';
let authorizedFlag = false;
let logDeviceFlag = false;
let manageFlag = false;
let techFlag = false;
let licenceFlag = false;
let gsFlag = false;
let xctrlFlag = false;
let chatFlag = true;
let fixationFlag = false;
let ws;

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

ymaps.ready(function () {
    // $('#workPlace').hide();
    $('#modal').hide();
    $('#switchLayout').parent().hide();
    createEye();
    $('#dropdownControlButton').trigger('click');
    $('#dropdownConnectionButton').trigger('click');
    $('#dropdownSettingsButton').trigger('click');
    $('#dropdownAdminMenu').trigger('click');
    $('#dropdownHelpButton').trigger('click');
    $('#dropdownLayersButton').trigger('click');
    $('#password').attr('style', 'position: initial;');

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
            }
        });

        $('#newLicenseKey').val('');
        $('#licenseDialog').dialog('open');
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
            }
        });
    });

    //Открытие вкладки с логами устройств
    $('#deviceLogButton').on('click', function () {
        openPage('/deviceLog');
    });

    $('#techArmButton').on('click', function () {
        $('#techDialog').dialog('open');
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

    $('#techSuppButton').on('click', function () {
        openPage('/techSupp');
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

    $('#changeUserButton').on('click', function () {
        $('#login').val('');
        $('#password').val('');
        $('#loginDialog').dialog('open');
    });

    $('#standardZUButton').on('click', () => {
        openPage('/greenStreet');
    });

    $('#charPointsButton').on('click', () => {
        openPage('/charPoints');
    });

    // $('#soundButton').on('click', () => {
    //     let audio = new Audio('/free/resources/zvuk-kasperskogo-vizg-svini.mp3');
    //     audio.autoplay = true;
    // });

    $('#dropdownConnectionButton').on('click', function () {
        if ($('#dropdownConnectionButton').attr('aria-expanded') === 'true') {
            ws.send(JSON.stringify({type: 'checkConn'}));
        }
    });

    //Проверка валидности пароля
    $('#newPassword').bind('input', function () {
        $('#newPasswordMsg').remove();
        if ($('#newPassword').val().length < 6) {
            $('#newPasswordForm').append('<div style="color: red;" id="newPasswordMsg"><h5>Пароль слишком короткий</h5></div>');
        }
    });

    $('#repPassword').bind('input', function () {
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
                        // alert('Пожалуйста, войдите в систему снова');
                        authorizedFlag = false;
                        manageFlag = false;
                        logDeviceFlag = false;
                        licenceFlag = false;
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

    //Создание и первичная настройка карты
    let map = new ymaps.Map('map', {
        center: [54.9912, 73.3685],
        zoom: 19,
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

    ws = new WebSocket('wss://' + location.host + '/mapW');
    ws.onerror = function (evt) {
        console.log('WebSocket error:' + evt);
    };

    ws.onopen = function () {
        // on connecting, do nothing but log it to the console
        console.log('connected')
    };

    //Функция для обновления статусов контроллеров в реальном времени
    ws.onmessage = function (evt) {
        let allData = JSON.parse(evt.data);
        let data = allData.data;
        console.log(data);
        // localStorage.setItem("maintab", "closed");
        switch (allData.type) {
            case 'mapInfo':
                regionInfo = data.regionInfo;
                areaInfo = data.areaInfo;
                // let techRegionInfo = (data.region === '*') ? regionInfo : data.region;
                // let techAreaInfo = (data.area === null) ? areaInfo : data.area;
                authorizedFlag = data.authorizedFlag;
                manageFlag = authorizedFlag ? data.access[2] : false;
                logDeviceFlag = authorizedFlag ? data.access[5] : false;
                licenceFlag = authorizedFlag ? data.access[6] : false;
                techFlag = authorizedFlag ? data.access[7] : false;
                gsFlag = authorizedFlag ? data.access[8] : false;
                xctrlFlag = authorizedFlag ? data.access[9] : false;
                if ((areaZone === undefined) && (data.areaZone !== undefined)) {
                    areaZone = data.areaZone;
                    createAreasLayout(map);
                }

                //Заполнение поля выбора регионов для перемещения
                for (let reg in regionInfo) {
                    $('#region').append(new Option(regionInfo[reg], reg));
                }
                fillAreas($('#area'), $('#region'), areaInfo);

                if (techFlag) {
                    makeTech(data, (data.area === null) ? areaInfo : data.area);
                }

                // map.controls.remove('searchControl');

                $('#regionForm').on('change', function () {
                    fillAreas($('#area'), $('#region'), areaInfo);
                });

                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);

                //Разбор полученной от сервера информации
                data.tflight.forEach(trafficLight => {
                    currnum = trafficLight.tlsost.num;
                    IDs.push(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
                    //Создание меток контроллеров на карте
                    let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                        hintContent: trafficLight.description + '<br>' + trafficLight.idevice
                    }, {
                        iconLayout: createChipsLayout(function (zoom) {
                            // Размер метки будет определяться функией с оператором switch.
                            return calculate(zoom);
                        }),
                    });
                    //Функция для вызова АРМ нажатием на контроллер
                    placemark.events.add('click', function () {
                        if (authorizedFlag) window.open(location.origin + '/user/' + localStorage.getItem('login') + '/cross?Region=' + trafficLight.region.num + '&Area=' + trafficLight.area.num + '&ID=' + trafficLight.ID);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                });
                authorize();
                let reg = regionInfo[data.region];
                let desc = data.description;
                if (authorizedFlag) {
                    $('#workPlace')[0].innerText = 'АСУДД "Микро" '
                        + ((data.region === '*') ? 'Все регионы' : ((reg === undefined) ? '' : reg))
                        + '\n' + ((desc === undefined) ? 'АРМ' : ((data.role === 'Viewer') ? 'АРМ наблюдателя' : 'АРМ дежурного - ') + data.description)
                        + '\n' + localStorage.getItem('login');
                    openAbout(true);
                }
                break;
            case 'tflight':
                if (data.tflight === null) {
                    console.log('null');
                } else {
                    console.log('Обновление');
                    if (data.areaZone !== undefined) {
                        areaZone = data.areaZone;
                        deleteSubareasLayout(map);
                        createSubareasLayout(map);
                    }
                    //Обновление статуса контроллера происходит только при его изменении
                    data.tflight.forEach(trafficLight => {
                        currnum = trafficLight.tlsost.num;
                        let id = trafficLight.ID;
                        let index = IDs.indexOf(trafficLight.region.num + '-' + trafficLight.area.num + '-' + id);
                        let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                            hintContent: trafficLight.description + '<br>' + trafficLight.idevice
                        }, {
                            iconLayout: createChipsLayout(function (zoom) {
                                // Размер метки будет определяться функией с оператором switch.
                                return calculate(zoom);
                            })
                        });
                        placemark.events.add('click', function () {
                            if (authorizedFlag) window.open(location.origin + '/user/' + localStorage.getItem('login') + '/cross?Region=' + trafficLight.region.num + '&Area=' + trafficLight.area.num + '&ID=' + trafficLight.ID);
                        });
                        //Замена метки контроллера со старым состоянием на метку с новым
                        map.geoObjects.splice(index, 1, placemark);
                    })
                }
                authorize();
                break;
            case 'repaint':
                map.geoObjects.removeAll();
                //Разбор полученной от сервера информации
                data.tflight.forEach(trafficLight => {
                    currnum = trafficLight.tlsost.num;
                    IDs.push(trafficLight.region.num + '-' + trafficLight.area.num + '-' + trafficLight.ID);
                    //Создание меток контроллеров на карте
                    let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                        hintContent: trafficLight.description + '<br>' + trafficLight.idevice
                    }, {
                        iconLayout: createChipsLayout(function (zoom) {
                            // Размер метки будет определяться функией с оператором switch.
                            return calculate(zoom);
                        }),
                    });
                    //Функция для вызова АРМ нажатием на контроллер
                    placemark.events.add('click', function () {
                        if (authorizedFlag) window.open(location.origin + '/user/' + localStorage.getItem('login') + '/cross?Region=' + trafficLight.region.num + '&Area=' + trafficLight.area.num + '&ID=' + trafficLight.ID);
                    });
                    //Добавление метки контроллера на карту
                    map.geoObjects.add(placemark);
                });
                areaZone = data.areaZone;
                createAreasLayout(map);
                break;
            case 'jump':
                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);
                break;
            case 'login':
                if (data.status) {

                    openAbout(true);

                    $('#login').val('');
                    $('#password').val('');
                    document.cookie = ('Authorization=Bearer ' + data.token);
                    localStorage.setItem('login', data.login);
                    // console.log('QqQqQ', data.areaZone);
                    authorizedFlag = data.authorizedFlag;
                    manageFlag = authorizedFlag ? data.access[2] : false;
                    logDeviceFlag = authorizedFlag ? data.access[5] : false;
                    licenceFlag = authorizedFlag ? data.access[6] : false;
                    techFlag = authorizedFlag ? data.access[7] : false;
                    gsFlag = authorizedFlag ? data.access[8] : false;
                    xctrlFlag = authorizedFlag ? data.access[9] : false;
                    areaZone = data.areaZone;
                    createAreasLayout(map);

                    if (techFlag) {
                        makeTech(data, (data.area === null) ? areaInfo : data.area);
                    }

                    $('#loginDialog').dialog('close');
                    chatFlag = true;
                    authorize();
                    $('#workPlace')[0].innerText = 'АСУДД "Микро" '
                        + ((data.region === '*') ? 'Все регионы' : regionInfo[data.region])
                        + '\n' + ((data.role === 'Viewer') ? 'АРМ наблюдателя' : 'АРМ дежурного - ')
                        + data.description + '\n' + localStorage.getItem('login');
                } else {
                    check(false, data.message);
                    $('#password').val('');
                }
                break;
            case 'logOut':
                // document.cookie = '';
                authorizedFlag = false;
                manageFlag = false;
                logDeviceFlag = false;
                licenceFlag = false;
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
                $('#workPlace')[0].innerText = 'АСУДД "Микро" ' + '\nАРМ';
                if (data.message !== undefined) alert(data.message);
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
            case 'error':
                if (data.message.includes('Invalid login credentials')) {
                    if (!($('#passwordMsg').length)) {
                        $('#passwordForm').append('<div style="color: red;" id="passwordMsg"><h5>Неверный логин и/или пароль</h5></div>');
                    }
                }
                break;
        }
    };

    ws.onclose = function (evt) {
        console.log('disconnected', evt);
        // alert('Связь с сервером была разорвана');
        location.reload();
        // automatically try to reconnect on connection loss
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
});

function authorize() {
    if (!authorizedFlag) {
        $('#loginButton').show();
        $('#logoutButton').hide();
        $('#leftToolbar').hide();
        // $('#serverLogButton').hide();
        // $('#DUJournalButton').hide();
        // $('#standardZUButton').hide();
        // $('#arbitraryZUButton').hide();
        // $('#charPointsButton').hide();
        // $('#soundButton').hide();
        $('#switchLayout').parent().hide();
        $('button[class*="dropdown"]').each(function () {
            $(this).hide();
        })
    } else {
        $('#loginButton').hide();
        $('#logoutButton').show();
        $('#leftToolbar').show();
        // $('#serverLogButton').show();
        // $('#DUJournalButton').show();
        // $('#standardZUButton').show();
        // $('#arbitraryZUButton').show();
        // $('#charPointsButton').show();
        // $('#soundButton').show();
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
    //licenceFlag
    (logDeviceFlag) ? $('#deviceLogButton').show() : $('#deviceLogButton').hide();
    (techFlag) ? $('#techArmButton').show() : $('#techArmButton').hide();
    (gsFlag) ? $('#standardZUButton').show() : $('#standardZUButton').hide();
    (xctrlFlag) ? $('#charPointsButton').show() : $('#charPointsButton').hide();
}

let createChipsLayout = function (calculateSize) {
    if (currnum === 0) {
        console.log('Возвращен несуществующий статус');
        return null;
    }
    // Создадим макет метки.
    let Chips = ymaps.templateLayoutFactory.createClass(
        '<div class="placemark"  style="background-image:url(\'' + location.origin + '/free/img/trafficLights/' + currnum + '.svg\'); background-size: 100%"></div>', {
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
        let polygon = convexHullTry(map, area.zone, 'Регион: ' + area.region + ', Область: ' + area.area);
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
            let polygon = convexHullTry(map, sub.zone, 'Регион: ' + area.region + ', Область: ' + area.area + ', Подобласть:' + sub.subArea);
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
        for (let reg in regionInfo) {
            $('#techRegion').append(new Option(regionInfo[reg], reg));
        }
        fillTechAreas($('#techArea'), $('#techRegion'), areaInfo);
    } else {
        $('#techRegion').append(new Option(regionInfo[data.region], data.region));
        $('#techRegion').prop('disabled', true);
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
        $area.prop('disabled', true);
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
    // ws.addEventListener('login', function (evt) {
    //     let allData = JSON.parse(evt.data);
    //     let data = JSON.parse(allData.data);
    //     document.cookie = ('Authorization=Bearer ' + data.token);
    // });
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