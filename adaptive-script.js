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
                    "ip_address": "111.222.333.333"
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