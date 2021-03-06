//Logger.log(); логирует выполнение
function init()
{
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheets()[0];
    let range = sheet.getRange(2, 1);
    let url = range.getValues();

    setData(sheet);
    setData(sheet);
    
    let response = UrlFetchApp.fetch(url);
    const contentText = response.getContentText();
    
    Logger.log(url);

    if(response.getResponseCode() == 200){
        Logger.log(response.getResponseCode());
        let ar = getComments(contentText);
        getMap(sheet, ar);
    }
}

function setData(sheet)
{
    let start = 2;
    let ar = [
        "Аватар пользователя", "Пользователь", "Роль", 
        "Дата вопроса", "Вопрос", "Оценка положительная", "Оценка отрицательная",
    ];
    for (let i=0; i < ar.length; i++){
        let s = start+i;
        sheet.getRange(1, s).setValue(ar[i]);
    }
}
function getComments(contentText)
{
    const $ = Cheerio.load(contentText);

    ar = {
        USER:{
            NAME: '',
            ROLE:'',
            IMG:'',
            DATE_QUESTION:'',
            QUESTION:'',
            GRADE:{
                TITLE:'Оценка вопроса',
                BAD:0,
                GOOD:0,
            }
        },
        LINKED_QUESTIONS:[],
        COMMENTS:[],
    };

    parent = $('.block.question-view');
    rowQuestion = $(parent).children('.row');
    ar.USER.NAME = $(parent).children('.username').text();
    ar.USER.ROLE = $(parent).children('.role').text();
    ar.USER.IMG = getImage($(rowQuestion).children('.col-sm-2.hidden-xs').children('img').attr('src'));
    ar.USER.QUESTION = $(rowQuestion).children('.comment-text').text();

    ar.USER.DATE_QUESTION = $(parent).children('.datetime').text();
    grade = $(parent).children('.rate.text-right');
    ar.USER.GRADE.GOOD = parseInt($(grade).children('.color-green').text());
    ar.USER.GRADE.BAD = parseInt($(grade).children('.color-red').text());

    if ($(parent).children('.linked-questions').length > 0) {
        $('.linked-question').each(function(i,node){
            tmp = {
                NAME: '',
                ROLE:'',
                IMG:'',
                DATE_QUESTION:'',
                QUESTION:''
            };
            tmp.NAME = $(node).find('.username').text();
            tmp.ROLE = $(node).find('.role').text();
            tmp.IMG = getImage($(node).find('img').attr('src'));
            tmp.DATE_QUESTION = $(node).find('.datetime').text();
            tmp.QUESTION = $(node).find('.comment-text').text().trim();
            ar.LINKED_QUESTIONS[i] = tmp; 
        });
    }
    comments = $('.comment-item');
    if(comments.length > 0){
        $(comments).each(function(i,node){
            tmp = {
                NAME: '',
                ROLE:'',
                IMG:'',
                DATE_COMMENT:'',
                COMMENT:''
            };
            tmp.NAME = $(node).find('.username').text();
            tmp.IMG = getImage($(node).find('img').attr('src'));
            tmp.ROLE = $(node).find('.role').text();
            tmp.DATE_COMMENT = $(node).find('.datetime').text();
            tmp.COMMENT = $(node).find('.comment-text').text().trim();
            ar.COMMENTS[i] = tmp; 
        });
    }
    return ar;
}

function getImage(text)
{
    let newstr = '';
    if(/www.gravatar.com/.test(text)){
        regex = /(\/\/)(.*$)/gm;
        newstr = 'http://' + text.replace(regex, "$2");
    }else if(/\/avatars\//.test(text)){
        newstr = 'https://фкт-алтай.рф' + text;
    }
    return newstr;
}


function getMap(sheet, ar)
{
    let row = 2;
    let column = 2;

    saveImg(sheet, row, column++, ar.USER.IMG);
    save(sheet, row, column++, ar.USER.NAME);
    save(sheet, row, column++, ar.USER.ROLE);
    save(sheet, row, column++, ar.USER.DATE_QUESTION);
    save(sheet, row, column++, ar.USER.QUESTION);
    save(sheet, row, column++, ar.USER.GRADE.GOOD);
    save(sheet, row, column++, ar.USER.GRADE.BAD);

    if(ar.LINKED_QUESTIONS.length > 0){
        row++;
        column = 2;
        save(sheet, row, column, 'Связанные вопросы');
        row++;
        for (let i=0; i < ar.LINKED_QUESTIONS.length; i++){
            saveImg(sheet, row, column++, ar.LINKED_QUESTIONS[i].IMG);
            save(sheet, row, column++, ar.LINKED_QUESTIONS[i].NAME);
            save(sheet, row, column++, ar.LINKED_QUESTIONS[i].ROLE);
            save(sheet, row, column++, ar.LINKED_QUESTIONS[i].DATE_QUESTION);
            save(sheet, row, column++, ar.LINKED_QUESTIONS[i].QUESTION);
            column = 2;
            row++;
        }
    }

    if(ar.COMMENTS.length > 0){
        column = 2;
        row++;
        save(sheet, row, column, 'Комментарии пользователей');
        row++;

        for (let i=0; i < ar.COMMENTS.length; i++){
            saveImg(sheet, row, column++, ar.COMMENTS[i].IMG);
            save(sheet, row, column++, ar.COMMENTS[i].NAME);
            save(sheet, row, column++, ar.COMMENTS[i].ROLE);
            save(sheet, row, column++, ar.COMMENTS[i].DATE_COMMENT);
            save(sheet, row, column++, ar.COMMENTS[i].COMMENT);
            column = 2;
            row++;
        }
    }
}

function save(sheet, row, column, value)
{
    sheet.getRange(row, column).setValue(value);
}

function saveImg(sheet, row, column, url)
{
    let image = SpreadsheetApp.newCellImage().setSourceUrl(url).setAltTextDescription('Пользователь').toBuilder().build();
    sheet.getRange(row, column).setValue(image);
}