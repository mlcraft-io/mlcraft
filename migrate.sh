./cli.sh hasura cli "migrate apply --all-databases" --build
./cli.sh hasura cli "seeds apply --all-databases"

./cli.sh hasura cli "metadata apply"
./cli.sh hasura cli "metadata reload"