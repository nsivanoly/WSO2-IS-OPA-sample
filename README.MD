# Using OPA Policies for Adaptive Authentication

## Setup OPA
### Download OPA
- **MacOS**: curl -L -o opa https://openpolicyagent.org/downloads/latest/opa\_darwin\_amd64
- **Linux**: curl -L -o opa https://openpolicyagent.org/downloads/latest/opa\_linux\_amd64
- **Windows**: Windows users can obtain the OPA executable from GitHub Releases. The steps below are the same for Windows users except the executable name will be different.
### Run the following command to set permissions on the OPA executable.

```shell
chmod 755 ./opa
```

### Run OPA engine

```shell
./opa run --server
```

### Create OPA policy
Write an OPA policy as shown in the example below. The policy below permits user authentication based on role, and allows only users that belong to the 'manager' or 'admin' role to log in. (file name has to have the extension of “.rego”. Eg: ispolicy.rego)

```rego
package play.policy
default permit = false

permit {
    role = ["manager" , "admin"]
    roles := input.user.roles
    roles[_] == role[_]
}
```
### Upload the policy
Upload the policy to the OPA engine using the following command.

```shell
  curl -X PUT http://localhost:8181/v1/policies/myapi --data-binary @ispolicy.rego
```

## OPA Connector
- Download the OPA connector from the [WSO2 Store](https://store.wso2.com/store/assets/isconnector/list)
- Place the connector into the dropping directory <IS\_HOME>/repository/components/dropins.
- Restart the Server.

## Configure the adaptive authentication script
- Log in to the management console using admin/admin credentials.
- Under the **Service Providers** section, click **Add**.
- Enter a name for the service provider under **Service Provider Name** and click **Register**.
- Expand **Local and Outbound Configuration** and click **Advanced Authentication**.
- Click **Templates** on the right side of the **Script Based Conditional Authentication** field, and add the following script.

    ```javascript
        var errorPage = '';
        var errorPageParameters = {
            'status': 'Unauthorized',
            'statusMsg': 'You need to be an admin or a manager'
        };
      
        var onLoginRequest = function(context) {
            executeStep(1, {
                onSuccess: function(context) {
                    invokeOPA('http://localhost:8181/v1/data/play/policy', {
                            "context": context,
                            "ip_address": "11-222.333.333"
                        },
                        {
                            "sendClaims": "false",
                            "sendRoles": "true"
                        },
                        {
                            onSuccess: function(context, data) {
                                var permit = data.result.permit;
                                Log.info('permit ' + permit);
                                Log.info("Successfully posted data.");
                                if (permit) {
                                    executeStep(2);
                                } else {
                                    Log.debug('User ' + context.currentKnownSubject.identifier + '');
                                    sendError(errorPage, errorPageParameters);
                                }
                            },
                            onFail: function(context) {
                                Log.info("Failed to post data");
                            }
                        });
                }
            });
        };
    ```

_Using the function ***invokeOPA*** in adaptive scripts, you can pass any JSON object with the context as the payload and then, using OPA, it is possible to process the data object and extract the required information. The OPA engine will then execute the defined policies and send back a JSON response to WSO2 IS. The final authentication or authorization decision will be made by OPA according to the policies that have been defined._

- Add two authentication steps.
    - Creating the first authentication step:
        - Click **Add Authentication Step**.
        - Select **basic** under **Local Authenticators** of Step 1 and click **Add Authenticator** (Adding basic authentication as a first step prompts the user to enter user credentials as the first step of authentication when logging in to the application).
    - Creating the second authentication step:
        - Click **Add Authentication Step**.
        - Select [**Demo Hardware Key**](https://is.docs.wso2.com/en/latest/learn/configuring-a-service-provider-for-adaptive-authentication/) under **Local Authenticators** of Step 2 and click **Add Authenticator**.
- Click **Update**.

## Try it out
- Access the application
- Click **Login** and enter admin/admin credentials.  You are prompted to use the hardware key after basic authentication according to the authentication step defined in the JavaScript above.
- Enter the 4 digit key given on the screen and click **Sign In**.
- Next, log out of the application and login again as a different user that is not assigned to any role. You will see that this will redirect you to an error page that displays the following error message: “You need to be an admin or a manager.”
