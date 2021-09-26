const models = require('../../../models');
const errors = require('@tryghost/errors');
const limitService = require('../../../services/limits');
const i18n = require('../../../../shared/i18n');

const authenticateContentApiKey = async function authenticateContentApiKey(req, res, next) {
    // allow fallthrough to other auth methods or final ensureAuthenticated check
    if (!req.query || !req.query.key) {
        return next();
    }

    if (req.query.key.constructor === Array) {
        return next(new errors.BadRequestError({
            message: i18n.t('errors.middleware.auth.invalidRequest'),
            code: 'INVALID_REQUEST'
        }));
    }

    let key = req.query.key;

    try {
        const apiKey = await models.ApiKey.findOne({secret: key}, {withRelated: ['integration']});

        if (!apiKey) {
            return next(new errors.UnauthorizedError({
                message: i18n.t('errors.middleware.auth.unknownContentApiKey'),
                code: 'UNKNOWN_CONTENT_API_KEY'
            }));
        }

        if (apiKey.get('type') !== 'content') {
            return next(new errors.UnauthorizedError({
                message: i18n.t('errors.middleware.auth.invalidApiKeyType'),
                code: 'INVALID_API_KEY_TYPE'
            }));
        }

        // CASE: blocking all non-internal: "custom" and "builtin" integration requests when the limit is reached
        if (limitService.isLimited('customIntegrations')
            && (apiKey.relations.integration && !['internal'].includes(apiKey.relations.integration.get('type')))) {
            // NOTE: using "checkWouldGoOverLimit" instead of "checkIsOverLimit" here because flag limits don't have
            //       a concept of measuring if the limit has been surpassed
            await limitService.errorIfWouldGoOverLimit('customIntegrations');
        }

        // authenticated OK, store the api key on the request for later checks and logging
        req.api_key = apiKey;

        next();
    } catch (err) {
        if (err instanceof errors.HostLimitError) {
            next(err);
        } else {
            next(new errors.InternalServerError({err}));
        }
    }
};

module.exports = {
    authenticateContentApiKey
};
