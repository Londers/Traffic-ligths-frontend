'use strict';

let jsonData;
let accInfo;
let areaInfo;
let regionInfo;
// let permissionsInfo;
let noDup = false;
let firstLoadFlag = true;

/**
 * @return {number}
 */
function sortByLogin(a, b) {
    let aName = a.login.toLowerCase();
    let bName = b.login.toLowerCase();
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

$(function () {

    //Закрытие вкладки при закрытии карты
//    window.setInterval(function () {
//        if(localStorage.getItem('maintab') === 'closed') window.close();
//    }, 1000);

    let $table = $('#table');

    //Всплывающее окно для создания пользователя
    $('#addDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                //Проверка корректности введённых данных
                if (($('#login').val() === '') || ($('#area option:selected').text() === '')) {
                    if (!($('#loginMsg').length) && ($('#login').val() === '')) {
                        $('#loginForm').append('<div style="color: red;" id="loginMsg"><h5>Введите логин</h5></div>');
                    }
                    if (!($('#areasMsg').length) && ($('#area option:selected').text() === '')) {
                        $('#areasForm').append('<div style="color: red;" id="areasMsg"><h5>Выберите районы</h5></div>');
                    }
                    return;
                }
                let selectedAreas = $('#area option:selected').toArray().map(item => item.value);
                let areas = [];

                selectedAreas.forEach(area => {
                    areas.push({
                        num: area
                    });
                });

                //Сбор данных для отправки на сервер
                let toSend = {
                    login: $('#login').val(),
                    workTime: parseInt($('#workTime option:selected').text()) * 60,
                    role: {name: $('#privileges option:selected').text(), permissions: permissionControl('a')},
                    region: {num: $('#region option:selected').val()},
                    area: areas,
                    description: $('#description').val()
                };

                //Отправка данных на сервер
                $.ajax({
                    url: window.location.href + '/add',
                    type: 'post',
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function (data) {
                        console.log(data.msg);
                        $('#addDialog').dialog('close');
                        $table.bootstrapTable('removeAll');
                        getUsers($table);
                        $('#showPass').val('Логин: ' + data.login + '\nПароль: ' + data.pass);
                        $('#showPass')[0].disabled = true;
                        $('#ui-id-3')[0].innerText = 'Успешное создание пользователя';
                        $('#showPassDialog').dialog('open');
                    },
                    data: JSON.stringify(toSend),
                    error: function (request) {
                        console.log(request.status + ' ' + request.responseText);
                        alert(JSON.parse(request.responseText).message);
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
            $('#loginMsg').remove();
            $('#areasMsg').remove();
        }
    });

    //Всплывающее окно для изменения пользователя
    $('#updateDialog').dialog({
        autoOpen: false,
        buttons: {
            'Подтвердить': function () {
                //Проверка корректности введённых данных
                if ($('#updateArea option:selected').text() === '') {
                    if (!($('#updateAreasMsg').length)) {
                        $('#updateAreasForm').append('<div style="color: red;" id="updateAreasMsg"><h5>Выберите районы</h5></div>');
                    }
                    return;
                }
                let selectedAreas = $('#updateArea option:selected').toArray().map(item => item.value);
                let areas = [];
                let login = $.map($table.bootstrapTable('getSelections'), function (row) {
                    return row.login;
                });

                selectedAreas.forEach(area => {
                    areas.push({
                        num: area
                    });
                });

                //Сбор данных для отправки на сервер
                let toSend = {
                    login: login[0],
                    role: {name: $('#updatePrivileges option:selected').text(), permissions: permissionControl('u')},
                    region: {num: $('#updateRegion option:selected').val()},
                    area: areas,
                    workTime: parseInt($('#updateWorkTime option:selected').text()) * 60,
                    description: $('#updateDescription').val()
                };

                //Отправка данных на сервер
                $.ajax({
                    url: window.location.href + '/update',
                    type: 'post',
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function (data) {
                        console.log(data.msg);
                        $('#updateDialog').dialog('close');
                        $table.bootstrapTable('removeAll');
                        getUsers($table);
                    },
                    data: JSON.stringify(toSend),
                    error: function (request) {
                        console.log(request.status + ' ' + request.responseText);
                        alert(JSON.parse(request.responseText).message);
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
            $('#updateAreasMsg').remove();
            $('#updateMsg').remove();
            $('#updateArea option:selected').each(function () {
                $(this).prop('selected', false);
            })
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

    //Добавление нового пользователя
    $('#appendButton').on('click', function () {
        $('#login').val('');
        $('#privileges').val('Viewer');
        fillAreas();
        $('#description').val('');

        $('#addDialog').dialog('open');
    });

    //Изменение существующего пользователя
    $('#updateButton').on('click', function () {
        $('#updateMsg').remove();
        let login = $.map($table.bootstrapTable('getSelections'), function (row) {
            return row.login;
        });

        if (login[0] === undefined) {
            $('#toolbar').append('<div style="color: red;" id="updateMsg"><h5>Выберите пользователя для изменения</h5></div>');
            return;
        }

        const selectedUser = accInfo.filter(user => user.login === login[0])[0];


        //костыль для TechAutomatic
        if ((selectedUser.role.name === 'Admin') && (localStorage.getItem('login') !== 'TechAutomatic')) {
            $('#toolbar').append('<div style="color: red;" id="updateMsg"><h5>Невозможно изменить администратора</h5></div>');
            return;
        }

        //костыль, чтобы регадмин не мог редактировать регадмина
        if ((selectedUser.role.name === 'RegAdmin') && (accInfo.filter(user => user.login === localStorage.getItem('login'))[0].role.name === 'RegAdmin')) {
            $('#toolbar').append('<div style="color: red;" id="updateMsg"><h5>Невозможно изменить регионального администратора</h5></div>');
            return;
        }

        selectedUser.role.permissions.forEach(perm => {
            $('input[id*="' + perm + '"]').each(function () {
                $(this).prop('checked', true);
            })
        });

        $('#updatePrivileges').val(selectedUser.role.name);
        $('#updateRegion').val(selectedUser.region.num);
        fillAreas();
        $.each(selectedUser.area, function (index, element) {
            $("#updateArea option[value='" + element.num + "']").prop("selected", true);
        });
        $('#updateWorkTime').val(selectedUser.workTime / 60);
        $('#updateDescription').val(selectedUser.description);

        // if (currPrivileges.name === 'Admin') {
        //     $('input[id^="u"]').each(function () {
        //         $(this).parent().hide();
        //     });
        // } else {
        $('input[id^="u"]').each(function () {
            $(this).parent().show();
        });
        // }

        $('#updateDialog').dialog('open');
    });

    //Удаление пользователя
    $('#deleteButton').on('click', function () {
        let login = $.map($table.bootstrapTable('getSelections'), function (row) {
            return row.login;
        });
        let loginToSend = {login: login[0]};
        //Отпрака на сервер запроса на удаление пользователя
        $.ajax({
            url: window.location.href + '/delete',
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                console.log(data.msg);
                $table.bootstrapTable('removeAll');
                getUsers($table);
            },
            data: JSON.stringify(loginToSend),
            error: function (request) {
                console.log(request.status + ' ' + request.responseText);
                alert(JSON.parse(request.responseText).message);
            }
        });
    });

    //Открытие вкладки с логами сервера
    $('#serverLogButton').on('click', function () {
        openPage('/serverLog');
    });

    //Открыте вкладки с редактируемыми ДК
    $('#editControlButton').on('click', function () {
        openPage('/crossEditControl');
    });

    //Открыте вкладки с проверкой БД
    $('#stateTest').on('click', function () {
        openPage('/stateTest');
    });

    $('#resetButton').on('click', () => {
        let currPrivileges;
        let currRegion;
        let currAreas;
        let currWorkTime;
        let currDescription;

        $('#updateMsg').remove();

        let login = $.map($table.bootstrapTable('getSelections'), function (row) {
            return row.login;
        });

        if (login[0] === undefined) {
            $('#toolbar').append('<div style="color: red;" id="updateMsg"><h5>Выберите пользователя для сброса пароля</h5></div>');
            return;
        }

        accInfo.forEach(user => {
            if (user.login === login[0]) {
                currPrivileges = user.role;
                currRegion = user.region.num;
                currAreas = user.area;
                currWorkTime = user.workTime;
                currDescription = user.description;
            }
        });

        //костыль для TechAutomatic
        if ((currPrivileges.name === 'Admin') && (localStorage.getItem('login') !== 'TechAutomatic')) {
            $('#toolbar').append('<div style="color: red;" id="updateMsg"><h5>Невозможно сбросить пароль администратора</h5></div>');
            return;
        }

        $.ajax({
            url: window.location.href + '/resetpw',
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                $('#showPass').val('Логин: ' + data.login + '\nНовый пароль: ' + data.pass);
                $('#showPass')[0].disabled = true;
                $('#ui-id-3')[0].innerText = 'Успешный сброс пароля';
                $('#showPassDialog').dialog('open');
            },
            data: JSON.stringify({login: login[0]}),
            error: function (request) {
                console.log(request.status + ' ' + request.responseText);
                alert(JSON.parse(request.responseText).message);
            }
        });
    });

    //Обнуление дополнительных прав и смене шаблона роли
    $('#updatePrivileges').change(function () {
        $('input[id*="u"]').each(function () {
            $(this).prop('checked', false);
        });
    });
    $('#privileges').change(function () {
        $('input[id*="u"]').each(function () {
            $(this).prop('checked', false);
        });
    });

    //обновление списка пользовтелей
    getUsers($table);
});

//Загрузка списка пользователей с сервера
function getUsers($table) {
    $.ajax({
        type: 'POST',
        url: window.location.href,
        success: function (data) {
            jsonData = data;
            regionInfo = data.regionInfo;
            areaInfo = data.areaInfo;
            // permissionsInfo = data.permInfo;
            if (data.accInfo !== null) {
                accInfo = data.accInfo.sort(sortByLogin);
                accInfo.forEach(account => {
                    let areas = '';
                    account.area.forEach(area => {
                        areas += area.nameArea + ', ';
                    });
                    let info = [];
                    //Заполнение структуры для дальнейшей записи в таблицу
                    info.push({
                        state: false,
                        login: account.login,
                        privileges: account.role.name,
                        region: account.region.nameRegion,
                        area: (areas !== '') ? areas.substring(0, areas.length - 2) : areas,
                        desc: account.description,
                        workTime: account.workTime / 60
                    });
                    $table.bootstrapTable('append', info);
                    $table.bootstrapTable('scrollTo', 'top');
                });
            }

            if (!noDup) {
                document.title = 'Личный кабинет';

                //Заполнение поля выбора регионов для создания пользователя
                for (let reg in regionInfo) {
                    $('#region').append(new Option(regionInfo[reg], reg));
                    $('#updateRegion').append(new Option(regionInfo[reg], reg));
                }

                fillAreas();

                //Заполнение поля выбора прав для создания пользователя
                data.roles.forEach(role => {
                    $('#privileges').append(new Option(role, role));
                    $('#updatePrivileges').append(new Option(role, role));
                });

                noDup = true;
            }
            console.log(data);
            if (firstLoadFlag) {
                for (let perm in data.permInfo) {
                    $('#privilegesForm').append('<div class="col-xs-2 mt-2" style="">\n' +
                        '                            <div class="form-group row ml-2 mr-1">\n' +
                        '                                <div class="col-xs-10 ml-1 pt-1">\n' +
                        '                                    <div class="form-check">\n' +
                        '                                        <label class="form-check-label">\n' +
                        '                                            <input type="checkbox" class="form-check-input" id="' + ('a' + data.permInfo[perm].id) + '" value="">' +
                        '                                            ' + data.permInfo[perm].description + '</label>\n' +
                        '                                    </div>\n' +
                        '                                </div>\n' +
                        '                            </div>\n' +
                        '                        </div>');
                    $('#updatePrivilegesForm').append('<div class="col-xs-2 mt-2" style="">\n' +
                        '                            <div class="form-group row ml-2 mr-1">\n' +
                        '                                <div class="col-xs-10 ml-1 pt-1">\n' +
                        '                                    <div class="form-check">\n' +
                        '                                        <label class="form-check-label">\n' +
                        '                                            <input type="checkbox" class="form-check-input" id="' + ('u' + data.permInfo[perm].id) + '" value="">' +
                        '                                            ' + data.permInfo[perm].description + '</label>\n' +
                        '                                    </div>\n' +
                        '                                </div>\n' +
                        '                            </div>\n' +
                        '                        </div>');
                }
                firstLoadFlag = false;
            }
        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
            alert(JSON.parse(request.responseText).message);
        }
    });

}

function permissionControl(dialog) {
    let currPrivileges = [];
    $('input[id^="' + dialog + '"]').each(function () {
        if ($(this).prop('checked')) {
            currPrivileges.push(Number($(this)[0].id.substring(1)))
        }
    });

    currPrivileges.forEach(perm => {
        $('input[id^="' + dialog + perm + '"]').each(function () {
            let id = Number($(this)[0].id.substring(1));
            let arr = currPrivileges;
            if ($(this).prop('checked')) {
                if (!arr.includes(id)) {
                    arr.push(id);
                }
            } else {
                if (arr.includes(id)) {
                    arr.splice(arr.indexOf(id), 1);
                }
            }
        })
    });
    return currPrivileges;
}

//Заполнение поля выбора районов для создания или изменения пользователя
function fillAreas() {
    $('#area').empty();
    $('#updateArea').empty();
    for (let regAreaJson in areaInfo) {
        for (let areaJson in areaInfo[regAreaJson]) {
            if (regAreaJson === $('#region').find(':selected').text()) {
                $('#area').append(new Option(areaInfo[regAreaJson][areaJson], areaJson));
            }
            if (regAreaJson === $('#updateRegion').find(':selected').text()) {
                $('#updateArea').append(new Option(areaInfo[regAreaJson][areaJson], areaJson));
            }
        }
    }
}

//Заполнение дополнительных привелегий ползователя
function fillPrivileges(type) {
    let currPrivileges = '';
    currPrivileges = (type === 'a') ? $('#privileges option:selected').text() : $('#updatePrivileges option:selected').text();

    if (currPrivileges === 'Admin') {
        $('input[id^="' + type + '"]').each(function () {
            $(this).parent().hide();
        });
    } else if ((currPrivileges === 'User') || (currPrivileges === 'Viewer') || (currPrivileges === 'RegAdmin')) {
        $('input[id^="' + type + '"]').each(function () {
            $(this).parent().show();
        });
    }
}

//Функция для открытия новой вкладки
function openPage(url) {
    window.open(window.location.href + url);
}