const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');

const params = {
    UserPoolId: "us-west-2_jJznqxKrF",
    Limit: 60
};

AWS.config.update({ region: "us-west-2" });
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

const exportUserPoolIdAndEmails = async () => {
    console.log(`Export Cognito UserPool user id and email with params=${JSON.stringify(params)}`);

    let paginationToken;

    do {
        if(paginationToken) {
            params.PaginationToken = paginationToken;
        }

        paginationToken = await inquireAndReturnPaginationToken(params, paginationToken);

        if(!paginationToken){
            console.log(`Finish exporting: ${new Date()}`);
        }
    } while (paginationToken);
}

function inquireAndReturnPaginationToken(params, paginationToken) {
    return new Promise((resolve, reject) => {
        cognitoidentityserviceprovider.listUsers(params, (err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                const userIdEmails = [];

                data.Users.forEach((user)=> {
                    const id = user.Username;
                    const email = user.Attributes.filter(attr => attr.Name === 'email')[0].Value;

                    userIdEmails.push([id, email]);
                });

                let idEmailsString = userIdEmails.map(data => data.join(",")).join("\n")

                fs.appendFileSync(path.join(__dirname, `id_email_mapping.csv`), idEmailsString + "\n");

                paginationToken=data.PaginationToken;
                resolve(data.PaginationToken);
            }
        });
    });
}

console.log(`Start exporting: ${new Date()}`);
exportUserPoolIdAndEmails();