const request = require('request-promise');

// https://docs.atlassian.com/software/jira/docs/api/REST/8.10.0/

// env vars
const data = {
    url: 'http://localhost:8084',
    username: '**********',
    password: '**********',
    branch: 'bugfix/PROJECT-1-ui-issues-for-small-screen-resolution'
};

const regExp = new RegExp('PROJECT-(\\d+)-');
const ticketId = data.branch.match(regExp)[1];
const issueUrl = `${data.url}/rest/api/latest/issue/PROJECT-${ticketId}`;
const fieldUrl = `${issueUrl}/transitions?expand=transitions.fields`;
const commentUrl = `${issueUrl}/comment`;

const options = {
    headers: {
        'Authorization': `Basic ${Buffer.from(`${data.username}:${data.password}`).toString('base64')}`,
        'Content-Type': 'application/json'
    },
    json: true
};

const getTicketStatusId = async status => {
    const response = await request(Object.assign(
        {},
        options,
        {
            method: 'GET',
            uri: fieldUrl
        }
    ));

    const {id} = response.transitions.find(({name}) => name.toLowerCase() === status.toLowerCase());
    return id;
};

const updateTicketStatus = async status => {
    const id = await getTicketStatusId(status);

    return request(Object.assign(
        {},
        options,
        {
            method: 'POST',
            uri: fieldUrl,
            body: {
                transition: {id}
            }
        }
    ));
};

const getComments = () => {
    return request(Object.assign(
        {},
        options,
        {
            method: 'GET',
            uri: commentUrl,
        }
    ));
};

const addComment = comment => {
    return request(Object.assign(
        {},
        options,
        {
            method: 'POST',
            uri: commentUrl,
            body: {
                body: comment
            }
        }
    ));
};

getComments()
    .then(({comments}) => {
        comments.forEach(({author, body}) => console.log('author', author.name, 'body', body));
    })
    .then(() => addComment('TAF comment \n URL: http://mysyte.net'))
    .then(getComments)
    .then(({comments}) => {
        comments.forEach(({author, body}) => console.log('author', author.name, 'body', body));
    })
    .then(() => updateTicketStatus('In progress'));

const run = async () => { // todo
    if (!regExp.test(data.branch)) {
        return;
    }

    const {comments} = await getComments();

    for (const {body} of comments) {
        if (body.includes('TODO')) {
            return;
        }
    }

    await addComment('TODO');
    return updateTicketStatus('TODO');
};

run()
    .then(() => console.log(' updated')); // todo
