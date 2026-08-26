/**
 * /api/common/v1/search-location/states:
 *   get:
 *     summary: Search states by country
 *     tags: [Common - Search Location]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *       - in: query
 *         name: isVerified
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Accepted for consistency with search APIs. States currently do not store verification flags, so results are unchanged.
 *     responses:
 *       200:
 *         description: States retrieved successfully
 *
 * /api/common/v1/search-location/cities:
 *   get:
 *     summary: Search cities by country and optional state
 *     tags: [Common - Search Location]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: stateId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *       - in: query
 *         name: isVerified
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Accepted for consistency with search APIs. Cities currently do not store verification flags, so results are unchanged.
 *     responses:
 *       200:
 *         description: Cities retrieved successfully
 */