'use strict';

let dataSave;
let regionInfo;
let areaInfo;

let armFlag = true;
let crossFlag = false;

$(document).ready(function () {
    let $armTable = $('#armTable');
    let $crossTable = $('#crossTable');
    load($armTable, $crossTable, true);
    $('#updateButton').on('click', function () {
        load($armTable, $crossTable, false);
    });
    $('#kickButton').on('click', function () {
        kick($armTable, $crossTable, armFlag);
    });
});

//Загрузка данных о редактируемых ДК в таблицу
function load($armTable, $crossTable, firstLoadFlag) {
    $.ajax({
        type: 'POST',
        url: window.location.href,
        success: function (data) {
            dataSave = data;
            console.log(data);
            if (firstLoadFlag) {
                regionInfo = data.regionInfo;
                areaInfo = data.areaInfo;
            }

            let dataArray = [];
            let tempRecord;

            //Заполнение данных для записи в таблицу
            data.arms.forEach(arm => {
                tempRecord = {
                    login: arm.login,
                    engaged: build(arm),
                    status: arm.edit ? 'Редактирует' : 'Просматривает'
                };
                dataArray.push(Object.assign({}, tempRecord))
            });

            $armTable.bootstrapTable('removeAll');
            $armTable.bootstrapTable('append', dataArray);
            $armTable.bootstrapTable('scrollTo', 'top');
            $armTable.bootstrapTable('refresh', {
                data: dataArray
            });

            $armTable.find('tbody tr').each(function () {
                let dayCounter = 0;
                $(this).find('td').each(function () {
                    if (dayCounter++ === 3) {
                        $(this).attr('style', 'white-space:normal;');
                    }
                })
            });

            dataArray = [];
            data.crosses.forEach(cross => {
                tempRecord = {
                    login: cross.login,
                    engaged: build(cross),
                    status: cross.edit ? 'Редактирует' : 'Просматривает'
                };
                dataArray.push(Object.assign({}, tempRecord))
            });

            $crossTable.bootstrapTable('removeAll');
            $crossTable.bootstrapTable('append', dataArray);
            $crossTable.bootstrapTable('scrollTo', 'top');
            $crossTable.bootstrapTable('refresh', {
                data: dataArray
            });

            $crossTable.find('tbody tr').each(function () {
                let dayCounter = 0;
                $(this).find('td').each(function () {
                    if (dayCounter++ === 3) {
                        $(this).attr('style', 'white-space:normal;');
                    }
                })
            });
        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
            // alert(JSON.parse(request.responseText).message);
        }
    });
    if (firstLoadFlag) {
        let first = true;
        $('.fixed-table-toolbar').each(function () {
            if (first) {
                $(this).append('<button id="updateButton" class="btn btn-secondary mr-5">Обновить</button>' +
                    ' <button id="kickButton" class="btn btn-secondary">Отключить</button>');
                first = false;
            }
        })
    }
}

//Отправка на сервер данных для отключения пользователя от редактирования ДК
function kick($armTable, $crossTable) {
    let selectedArms = $armTable.bootstrapTable('getSelections');
    let selectedCrosses = $crossTable.bootstrapTable('getSelections');
    let toSend = Object.assign({}, dataSave);
    toSend.arms = [];
    toSend.crosses = [];
    console.log(dataSave.arms);
    console.log(selectedArms);

    selectedArms.forEach(arm => {
        toSend.arms.push(unBuild(arm.login, arm.engaged, armFlag));
    });

    selectedCrosses.forEach(cross => {
        toSend.crosses.push(unBuild(cross.login, cross.engaged, crossFlag));
    });

    $.ajax({
        url: window.location.href + '/free',
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data, textStatus, xhr) {
            if (xhr.status === 200) {
                $('#updateButton').trigger('click');
            } else {
                alert('Произошла ошибка, попробуйте снова');
            }
            console.log(data.msg);
        },
        data: JSON.stringify(toSend),
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
            // alert(JSON.parse(request.responseText).message);
        }
    });
}

//Корректное заполнение описания ДК в таблице
function build(data) {
    return ' Регион: ' + getRegionDesc(data.pos.region) + '\n Район: ' + getAreaDesc(data.pos.region, data.pos.area)
        + '\n Описание: ' + data.description + '\n Номер устройства: ' + data.idevice;
}

//Изъятие данных из описания ДК
function unBuild(login, description, switchFlag) {
    let data = description.split('\n');
    return find(login, data[2].substring(11), switchFlag);
}

//Возвращение ДК по описанию
function find(login, description, switchFlag) {
    let item = {pos : {}, login: ''};
    if (switchFlag) {
        dataSave.arms.forEach(arm => {
            if ((arm.description === description) && (arm.login === login)) {
                item.login = arm.login;
                item.pos = arm.pos;
            }
        })
    } else {
        dataSave.crosses.forEach(cross => {
            if ((cross.description === description) && (cross.login === login)) {
                item.login = cross.login;
                item.pos = cross.pos;
            }
        })
    }
    return item;
}

//Получение описания региона по номеру
function getRegionDesc(region) {
    return regionInfo[Number(region)];
}

//Получение описания района по номеру
function getAreaDesc(region, area) {
    return areaInfo[getRegionDesc(region)][Number(area)];
}