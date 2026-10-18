FROM postgres:15-alpine

ARG PGVECTOR_VERSION=v0.5.0

# Same base/collation as the existing volume (Alpine musl); only adds the vector extension
RUN apk add --no-cache --virtual .build-deps git build-base \
 && git clone --branch ${PGVECTOR_VERSION} --depth 1 https://github.com/pgvector/pgvector.git /tmp/pgvector \
 && cd /tmp/pgvector \
 && make OPTFLAGS="" with_llvm=no \
 && make install with_llvm=no \
 && rm -rf /tmp/pgvector \
 && apk del .build-deps
