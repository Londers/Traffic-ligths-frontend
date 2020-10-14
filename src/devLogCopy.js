let regionInfo;
let areaInfo;
let devicesSave;
//0 - технология, 1 - по устройству, 2 - двери+лампы
let type = 0;

function sortByTime(a, b) {//new Date(log.time)
    return new Date(b.time).getTime() - new Date(a.time).getTime();
}

$(() => {

    $.ajax({
        url: window.location.href,
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            regionInfo = Object.assign({}, data.regionInfo);
            areaInfo = Object.assign({}, data.areaInfo);
            devicesSave = data.devices;

            $('.fixed-table-toolbar').append(
                '<div class="form-group row">\n' +
                '    <div class="col-md-1 mt-1">\n' +
                '        <label for="id" class="mt-2">Номер ДК</label>\n' +
                '    </div>\n' +
                '    <div class="col-xs-2 mt-1">\n' +
                '        <input type="number" class="form-control mt-2" id="id" required=""\n' +
                '               style="max-width: 100px;max-height: 30px;">\n' +
                '    </div>\n' +
                '    <div class="col-md-1 mt-1 ml-4">\n' +
                '        <label for="area" class="text-right mt-2">Район</label>\n' +
                '    </div>\n' +
                '    <div class="col-md-3 mt-1">\n' +
                '        <select class="form-control mt-1" id="area">\n' +
                '        </select>    \n' +
                '    </div>\n' +
                '    <div class="col-md-3 mt-1">\n' +
                '    <div class="row">       ' +
                '       <button id="getLog" class="btn btn-secondary ml-4 mt-1">24 часа</button>\n' +
                '       <button id="timeButton2" class="btn btn-secondary ml-4 mt-1">Выбранное время</button>' +
                '    </div>' +
                '    </div>\n' +
                '</div>'
            );

            let now = new Date();
            $('#dateEnd').attr('value', (now.toISOString().slice(0, 10)));
            $('#timeEnd').attr('value', (prettyNumbers(now.getHours()) + ':' + prettyNumbers(now.getMinutes())));
            now = new Date(now.getTime() - ((24 * 60) * 60 * 1000)); // - (now.getTimezoneOffset() * 60 * 1000));
            $('#dateStart').attr('value', (now.toISOString().slice(0, 10)));
            $('#timeStart').attr('value', (prettyNumbers(now.getHours()) + ':' + prettyNumbers(now.getMinutes())));
            $('#getLog').on('click', () => {
                let now = new Date();
                now = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
                let timeStart = timeCalc(now, (24 * 60) * 60);
                let timeEnd = now.toISOString();
                getLogs(timeStart, timeEnd);
            });

            $('#timeButton2').on('click', () => {
                let timeStart = $('#dateStart')[0].value + 'T' + $('#timeStart')[0].value;
                let timeEnd = $('#dateEnd')[0].value + 'T' + $('#timeEnd')[0].value;
                getLogs(timeStart + ':00Z', timeEnd + ':00Z');
            });
            $('#type').on('click', () => {
                type = Number($('#type').val());
                buildLogTable();
            });

            fillAreas($('#area'), '1');
        },
        // data: JSON.stringify(data.state),
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
        }
    });
});

//Заполнение поля выбора районов для создания или изменения пользователя
function fillAreas($area, region) {
    $area.empty();
    for (let regAreaJson in areaInfo) {
        for (let areaJson in areaInfo[regAreaJson]) {
            if (getRegionNum(regAreaJson) === region) {
                $area.append(new Option(areaInfo[regAreaJson][areaJson], areaJson));
            }
        }
    }
}

function getLogs(start, end, remoteOpenFlag) {
    // {ID: '', area: '', region: ''}
    // console.log('start:' + start + '   end' + end);
    let toSend = {
        devices: [{
            ID: Number($('#id').val()),
            area: $('#area').val(),
            region: '1'
        }], timeStart: start, timeEnd: end
    };
    // let selected = $('#table').bootstrapTable('getSelections');
    // selected.forEach(cross => {
    //     toSend.devices.push({
    //         ID: Number($('#id').val()),
    //         area: getAreaNum('1', $('#area').val()),
    //         region: '1'
    //     });
    // });
    //
    // if (!selected.length) {
    //     if (remoteOpenFlag) {
    //         toSend.devices.push({
    //             ID: Number(localStorage.getItem('ID')),
    //             area: localStorage.getItem('area'),
    //             region: localStorage.getItem('region'),
    //             description: localStorage.getItem('description')
    //         });
    //         localStorage.setItem('ID', undefined);
    //         localStorage.setItem('area', undefined);
    //         localStorage.setItem('region', undefined);
    //         localStorage.setItem('description', undefined);
    //     } else {
    //         $('#toolbar0').append('<div style="color: red;" id="toolbar0Msg"><h5>Выберите устройства</h5></div>');
    //         return;
    //     }
    // } else {
    //     $('#toolbar0Msg').remove();
    // }
    //Отправка на сервер запроса проверки данных
    $.ajax({
        type: 'POST',
        url: window.location.href + '/info',
        data: JSON.stringify(toSend),
        dataType: 'json',
        success: function (data) {
            // console.log('QUQUQUQUQUUQ', data);
            buildLogTable(data)
        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
        }
    });
    console.log(toSend);
}

function buildLogTable(data) {
    (data === undefined) ? data = dataSave : dataSave = data;
    let allData = [];
    data.deviceLogs.sort(sortByTime);
    data.deviceLogs.forEach((log, index) => {
        let localPrevDate, duration;
        let date = new Date(log.time);
        let localDate = date.toLocaleString('ru-RU', {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone});
        if ((index < data.deviceLogs.length) && (index !== 0)) {
            let prevDate = new Date(data.deviceLogs[index - 1].time);
            localPrevDate = prevDate.toLocaleString('ru-RU', {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone});
            duration = Math.floor((new Date(data.deviceLogs[index - 1].time).getTime() - new Date(log.time).getTime()));// 1000);
            let hours = new Date(duration).getHours() - 6;
            let minutes = new Date(duration).getMinutes();
            let seconds = new Date(duration).getSeconds();
            duration = hours + 'ч ' + minutes + 'м ' + seconds + 'с';
        }
        let text = log.text;
        let description = getDescription('1', $('#area').val(), Number($('#id').val()));
        let add = {
            time: date.getTime(),
            numDk: $('#id').val(),
            descDk: description,
            eventDate: localDate.split(',')[0],
            eventTime: localDate.split(',')[1],
            endTime: (localPrevDate !== undefined) ? localPrevDate.split(',')[1] : '',
            duration: (duration !== undefined) ? duration : '',
            type: '?',
            arm: '?',
            status: text,
            mode: '?',
            phase: '?',
            star: '?',
            endDate: (localPrevDate !== undefined) ? localPrevDate.split(',')[0] : ''
        };

        if (log.type === type) allData.push(add);
    });

    if (type == '0') {
        //Переходы отображать не нужно, они прибавляются к следующей фазе
        allData.forEach((rec, index) => {
           if (rec.status.includes('Переход')) {
               if (index !== 0) {
                   // allData[index-1].duration += rec.duration;
                   //Разбираются два стринга и суммируются их значения
                    let dur1 = allData[index-1].duration;
                    let dur2 = rec.duration;
                    let d1 = dur1.split(' ');
                    d1.forEach((el, i) => {d1[i] = el.slice(0, -1)});
                    let d2 = dur2.split(' ');
                    d2.forEach((el, i) => {d2[i] = el.slice(0, -1)});
                   allData[index-1].duration = (Number(d1[0]) + Number(d2[0])) + 'ч ' +
                       (Number(d1[1]) + Number(d2[1])) + 'м ' + (Number(d1[2]) + Number(d2[2])) + 'с';
                   allData[index-1].eventDate = rec.eventDate;
                   allData[index-1].eventTime = rec.eventTime;
               }
               allData.splice(index, 1);
           }
        });
    }

    // if ($('#selection').prop('checked')) {
    //     $.each(allData, function (i, el) {
    //         if (el.message.startsWith('Режим')) {
    //             if (sortedData.length === 0) {
    //                 sortedData = [allData[i]];
    //             } else if (sortedData[sortedData.length - 1].message !== el.message) sortedData.push(el);
    //         }
    //         // if($.inArray(el.message, sortedData) === -1) sortedData.push(el);
    //     });
    //     console.log(sortedData);
    // }

    $('#logsTable')
        .bootstrapTable('load', (allData))//$('#selection').prop('checked')) ? sortedData : allData)
        .bootstrapTable('scrollTo', 'top')
        .bootstrapTable('refresh', {
            data: allData
        });
}

function getDescription(region, area, id) {
    let desc = '';
    devicesSave.forEach((dev) => {
        if ((dev.region === region) && (dev.area === area) && (dev.ID === id)) desc = dev.description
    });
    return desc;

}

function prettyNumbers(number) {
    return (number < 10) ? '0' + number : number;
}

function timeCalc(now, offset) {
    return (new Date(now.getTime() - (offset * 1000))).toISOString();
}

// function findIdByDescription(description) {
//     let id = 0;
//     IDs.forEach(ID => {
//         if (ID.description === description) id = ID.ID;
//     });
//     return id;
// }

//Получение номера региона по описанию
function getRegionNum(region) {
    let num = 0;
    for (let reg in regionInfo) {
        if (regionInfo[reg] === region) num = reg;
    }
    return num.toString();
}

// //Получение номера района по описанию
// function getAreaNum(region, area) {
//     let num = 0;
//     for (let ar in areaInfo[region]) {
//         if (areaInfo[region][ar] === area) num = ar;
//     }
//     return num.toString();
// }