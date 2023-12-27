const http = require("http");
const fs = require('fs')

const host = 'localhost';
const port = 8000;

const restrictByMethod = (method, req, res) => {
    if (req.method !== method) {
        res.writeHead(405)
        res.end('HTTP method not allowed')
        return true
    }
    return false
}

const readBody = (req) => new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
        body += chunk;
    });
    req.on('end', () => {
        resolve(JSON.parse(body))
    });
})

const processGet = (req, res) => {
    const isRestricted = restrictByMethod('GET', req, res)
    if (isRestricted) { return }
    try {
        const files = fs.readdirSync('./files')
        res.write(JSON.stringify(files))
        res.end()
    } catch (e) {
        res.writeHead(500)
        res.end('Internal server error')
    }
}

const processDelete = async (req, res) => {
    const isRestricted = restrictByMethod('DELETE', req, res)
    if (isRestricted) { return }
    const isAuthorized = handleAuthorizationCheck(req.headers.cookie)
    if (!isAuthorized) { return }
    const { filename } = await readBody(req)
    if (filename) {
        try {
            fs.unlinkSync(`./files/${filename}`)
            res.writeHead(200)
            res.end('success!')
        } catch (err) {
            res.writeHead(500)
            res.end('Internal server error')
        }
    }
}

const handleAuthorizationCheck = (cookieHeader) => {
    const cookieKeyValues = cookieHeader.split(';').map((c) => c.trim().split('='))
    const cookieMap = new Map(cookieKeyValues)
    const isAuthorized = Boolean(cookieMap.get('authorized')) && Number(cookieMap.get('userId')) === user.id
    if (!isAuthorized) {
        res.writeHead(401)
        res.end('unauthorized!')
    }

    return isAuthorized
}

const processPost = async (req, res) => {
    const isRestricted = restrictByMethod('POST', req, res)
    if (isRestricted) { return }
    const isAuthorized = handleAuthorizationCheck(req.headers.cookie)
    if (!isAuthorized) { return }
    const { content, filename } = await readBody(req)
    if (content && filename) {
        try {
            fs.writeFileSync(`./files/${filename}`, content)
            res.writeHead(200)
            res.end('success!')
        } catch (err) {
            res.writeHead(500)
            res.end('Internal server error')
        }
    }
}

const processRedirect = (req, res) => {
    res.writeHead(301, {
        'Location': 'redirected'
    })
    res.end()
}

const user = {
    id: 123,
    username: 'testuser',
    password: 'qwerty'
};

const TWO_DAYS = 172800

const processAuth = async (req, res) => {
    const isRestricted = restrictByMethod('POST', req, res)
    if (isRestricted) { return }
    const { id, username, password } = await readBody(req)
    if (username === user.username && password === user.password) {
        res.writeHead(200, {
            'set-cookie': `authorized=${true}; userId=${id}; MAX_AGE=${TWO_DAYS}`
        })
        res.end('authorized!')
    } else {
        res.writeHead(400)
        res.end('Неверный логин или пароль')
    }
}

const requestListener = async (req, res) => {
    if (req.url === '/get') {
        processGet(req, res)
    } else if (req.url === '/post') {
        processPost(req, res)
    } else if (req.url === '/delete') {
        processDelete(req, res)
    } else if (req.url === '/redirect') {
        processRedirect(req, res)
    }  else if (req.url === '/auth') {
        await processAuth(req, res)
    } else {
        res.writeHead(404);
        res.end('not found');
    }
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});