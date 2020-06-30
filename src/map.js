'use strict';

let currnum = -1;
let IDs = [];
let areaLayouts = [];
let statuses = [];
let regionInfo;
let areaInfo;
let areaBox;
// let login = '';
let authorizedFlag = false;
let logDeviceFlag = false;
let manageFlag = false;
let techFlag = false;
let chatFlag = true;
let ws;

//Функция для открытия вкладки
function openPage(url) {
    window.open(location.origin + '/user/' + localStorage.getItem('login') + url);
}

function getRandomColor() {
    var letters = '0123456789A';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 11)];
    }
    return color;
}

ymaps.ready(function () {
    $('#workPlace').hide();
    $('#switchLayout').parent().hide();
    createEye();
    $('#dropdownMenuButton').trigger('click');
    $('#password').attr('style', 'position: initial;');

    // //Для управления закладками
    // localStorage.setItem("maintab", "open");

    // window.onbeforeunload = function () {
    //     localStorage.setItem("maintab", "closed");
    //     sleep(500);
    // };

    $('#changeDialog').show();

    //Открытие личного кабинета
    $('#manageButton').on('click', function () {
        openPage('/manage');
    });

    //Открытие вкладки с логами устройств
    $('#deviceLogButton').on('click', function () {
        openPage('/map/deviceLog');
    });

    $('#techButton').on('click', function () {
        $('#techDialog').dialog('open');
        // openPage('/techArm?Region=1&Area=1&Area=2');
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

    //Выбор места для открытия на карте
    $('#loginButton').on('click', function () {
        $('#login').val('');
        // $('#password').val('');
        $('#loginDialog').dialog('open');
    });

    //Выход из аккаунта
    $('#logoutButton').on('click', function () {
        if (confirm('Вы уверены?')) {
            ws.send(JSON.stringify({type: 'logOut'}));
        }
        // $.ajax({
        //     type: 'POST',
        //     url: location.href + '/logOut',
        //     success: function (data) {
        //         location.href = location.origin;
        //     },
        //     error: function (request) {
        //         console.log(request.status + ' ' + request.responseText);
        //     }
        // });
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
                        alert('Пожалуйста, войдите в систему снова');
                        authorizedFlag = false;
                        manageFlag = false;
                        logDeviceFlag = false;
                        techFlag = false;
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

    $('#switchLayout').on('change', function () {
        if ($('#switchLayout').prop('checked')) {
            if (areaLayouts.length === 0) createAreasLayout(map);
        } else {
            if (areaLayouts.length !== 0) deleteAreasLayout(map);
        }
    });

    ws = new WebSocket('ws://' + location.host + '/mapW');
    ws.onerror = function (evt) {
        console.log('WebsSocket error:' + evt);
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
                manageFlag = data.manageFlag;
                logDeviceFlag = data.logDeviceFlag;
                techFlag = data.techArmFlag;
                if ((areaBox === undefined) && (data.areaBox !== undefined)) {
                    areaBox = data.areaBox;
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
                    statuses.push(currnum);
                    //Создание меток контроллеров на карте
                    let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                        hintContent: trafficLight.description
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
                $('#workPlace')[0].innerText = 'Рабочее место: ' + data.description;
                break;
            case 'tflight':
                if (data.tflight === null) {
                    console.log('null');
                } else {
                    console.log('Обновление');
                    //Обновление статуса контроллера происходит только при его изменении
                    data.tflight.forEach(trafficLight => {
                        currnum = trafficLight.tlsost.num;
                        let id = trafficLight.ID;
                        let index = IDs.indexOf(trafficLight.region.num + '-' + trafficLight.area.num + '-' + id);
                        let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                            hintContent: trafficLight.description
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
                    statuses.push(currnum);
                    //Создание меток контроллеров на карте
                    let placemark = new ymaps.Placemark([trafficLight.points.Y, trafficLight.points.X], {
                        hintContent: trafficLight.description
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
                areaBox = data.areaBox;
                createAreasLayout(map);
                break;
            case 'jump':
                map.setBounds([
                    [data.boxPoint.point0.Y, data.boxPoint.point0.X],
                    [data.boxPoint.point1.Y, data.boxPoint.point1.X]
                ]);
                break;
            case 'login':
                document.cookie = ('Authorization=Bearer ' + data.token);
                localStorage.setItem('login', data.login);
                console.log('QqQqQ', data.areaBox);
                authorizedFlag = data.authorizedFlag;
                manageFlag = data.manageFlag;
                logDeviceFlag = data.logDeviceFlag;
                techFlag = data.techArmFlag;
                areaBox = data.areaBox;
                createAreasLayout(map);

                if (techFlag) {
                    makeTech(data, (data.area === null) ? areaInfo : data.area);
                }

                $('#loginDialog').dialog('close');
                chatFlag = true;
                authorize();
                $('#workPlace')[0].innerText = 'Рабочее место: ' + data.description;
                break;
            case 'logOut':
                // document.cookie = '';
                authorizedFlag = false;
                manageFlag = false;
                logDeviceFlag = false;
                techFlag = false;
                authorize();
                $('#myForm').remove();
                $('.open-button').remove();
                $('#login').val('');
                $('#password').val('');
                deleteAreasLayout(map);
                // location.href = location.origin;
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

    ws.onclose = function () {
        console.log('disconnected');
        // alert('Связь была разорвана');
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

    $('#loginDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                check();
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
        $('#changeButton').hide();
        $('#workPlace').hide();
        $('#switchLayout').parent().hide();
    } else {
        $('#loginButton').hide();
        $('#logoutButton').show();
        $('#changeButton').show();
        $('#workPlace').show();
        $('#switchLayout').parent().show();
        if (chatFlag) {
            $('body')[0].appendChild($('#chat')[0].content.cloneNode(true));
            chatFlag = false;
        }
    }
    (logDeviceFlag) ? $('#deviceLogButton').show() : $('#deviceLogButton').hide();
    (manageFlag) ? $('#manageButton').show() : $('#manageButton').hide();
    (techFlag) ? $('#techButton').show() : $('#techButton').hide();
}

let createChipsLayout = function (calculateSize) {
    if (currnum === 0) {
        console.log('Возвращен несуществующий статус');
        return null;
    }
    // Создадим макет метки.
    let Chips = ymaps.templateLayoutFactory.createClass(
        '<div class="placemark"  style="background-image:url(\'free/img/trafficLights/' + currnum + '.svg\'); background-size: 100%"></div>', {
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
    }
};


function createAreasLayout(map) {
    if (!$('#switchLayout').prop('checked')) return;
    areaBox.forEach(area => {
        let color = getRandomColor();
        let myRectangle = new ymaps.Rectangle([
            // Задаем координаты диагональных углов прямоугольника.
            [area.Box.point0.Y, area.Box.point0.X],
            [area.Box.point1.Y, area.Box.point1.X]
        ], {
            //Свойства
            hintContent: 'Регион: ' + area.Region + ', Область: ' + area.Area,
            balloonContent: 'азаза'
        }, {
            // Опции.
            // Цвет и прозрачность заливки.
            fillColor: color,
            // Дополнительная прозрачность заливки..
            // Итоговая прозрачность будет не #33(0.2), а 0.1(0.2*0.5).
            fillOpacity: 0.1,
            // Цвет обводки.
            strokeColor: color,
            // Прозрачность обводки.
            strokeOpacity: 0.5,
            // Ширина линии.
            strokeWidth: 2,
            // Радиус скругления углов.
            // Данная опция принимается только прямоугольником.
            borderRadius: 6
        });
        areaLayouts.push(myRectangle);
        map.geoObjects.add(myRectangle);
    })
}

function deleteAreasLayout(map) {
    areaLayouts.forEach(layout => {
        map.geoObjects.remove(layout);
    });
    areaLayouts = [];
}

//Заполнение поля выбора регионов для АРМ технолога
function makeTech(data, techAreaInfo) {
    if(data.region === '*') {
        for (let reg in regionInfo) {
            $('#techRegion').append(new Option(regionInfo[reg], reg));
        }
        fillAreas($('#techArea'), $('#techRegion'), areaInfo);
    } else {
        $('#techRegion').append(new Option(regionInfo[data.region], data.region));
        $('#techRegion').prop('disabled', true);
        fillTechAreas($('#techArea'), $('#techRegion'), techAreaInfo);
    }

    $('#techRegionForm').on('change', function () {
        fillAreas($('#techArea'), $('#techRegion'), areaInfo);
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
        $area.append(new Option(areaInfo[regAreaJson], regAreaJson))
        num = regAreaJson;
    }
    if(areaInfo === undefined) return;
    if (Object.keys(areaInfo).length === 1) {
        $("#techArea option[value='" + num + "']").prop("selected", true);
        $area.prop('disabled', true);
    }
}

function check() {

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

    //Отправка на сервер запроса проверки данных
    // $.ajax({
    //     type: 'POST',
    //     url: window.location.origin + '/login',
    //     data: JSON.stringify(account),
    //     dataType: 'json',
    //     success: function (data, text, xhr) {
    //         if (xhr.status !== 200) return;
    //         document.cookie = ('Authorization=Bearer ' + data.token);
    //         //В случае успешного логина, перенаправление на участок карты данного пользователя
    //         location.href = window.location.origin + '/user/' + $('#login').val() + '/map';
    //     },
    //     error: function (request) {
    //         if (!($('#passwordMsg').length)){
    //             $('#passwordForm').append('<div style="color: red;" id="passwordMsg"><h5>Неверный логин и/или пароль</h5></div>');
    //         }
    //         console.log(request.status + ' ' + request.responseText);
    //     }
    // });

    ws.send(JSON.stringify({type: 'login', login: $('#login').val(), password: $('#password').val()}));
    $('#login').val('');
    $('#password').val('');
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
};