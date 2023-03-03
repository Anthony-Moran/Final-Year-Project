from flask import Flask, render_template, make_response
from flask_restful import Api, Resource

app = Flask(__name__)
api = Api(app)


class Demo(Resource):
    def get(self):
        headers = {"Content-Type": "text/html"}
        return make_response(render_template("chess.html"), 200, headers)


def main():
    api.add_resource(Demo, "/")
    app.run(host='127.0.0.1', port='8000', debug=True)


if __name__ == "__main__":
    main()
