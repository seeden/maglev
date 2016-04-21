export default function (route) {
  route
    .vhost('local.zabavnetesty.sk')
    .api()
    .route('/test1')
      .get('/', (req, res) => {
        res.jsonp({
          host: 'local.zabavnetesty.sk',
        });
      });

  route
    .vhost('local.meetbus.com')
    .api()
    .route('/test2')
      .get('/', (req, res) => {
        res.jsonp({
          host: 'local.meetbus.com',
        });
      });
}
