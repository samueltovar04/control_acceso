package com.access.control.component;

import org.json.JSONObject;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResponseErrorHandler;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.context.request.WebRequest;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Map;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.Series.CLIENT_ERROR;
import static org.springframework.http.HttpStatus.Series.SERVER_ERROR;

@Component
public class RestTemplateResponseErrorHandler
        implements ResponseErrorHandler {

    @Override
    public boolean hasError(ClientHttpResponse httpResponse)
            throws IOException {

        return (
                httpResponse.getStatusCode().series() == CLIENT_ERROR
                        || httpResponse.getStatusCode().series() == SERVER_ERROR);
    }
    public final ResponseEntity<Object> handleException(Exception ex, WebRequest request) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        JsonParser springParser = JsonParserFactory.getJsonParser();
        if (ex instanceof HttpStatusCodeException) {
            if (((HttpStatusCodeException) ex).getRawStatusCode() == 500) {
                Object map = springParser.parseList(((HttpStatusCodeException) ex).getResponseBodyAsString());
                if (map instanceof Map) {
                    Map<?, ?> error = (Map<?, ?>) map;
                    if (error.get("errorCode").equals("007") || error.get("errorCode").equals("000") || error.get("errorCode").equals("090") || error.get("errorCode").equals("015")) {
                        return new ResponseEntity<>(error, HttpStatus.NO_CONTENT);
                    }
                }


            }
        }
        return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
    }


    @Override
    public void handleError(ClientHttpResponse httpResponse)
            throws IOException {

        if (httpResponse.getStatusCode()
                .series() == HttpStatus.Series.SERVER_ERROR) {
            try {
               JSONObject error = this.streamToString(httpResponse.getBody());
                if(error.get("errorCode").equals("007") || error.get("errorCode").equals("000") || error.get("errorCode").equals("090") || error.get("errorCode").equals("015")) {
                    throw new RestClientResponseException(error.toString(), (int) HttpStatus.NO_CONTENT.value(),  HttpStatus.NO_CONTENT.toString(), null, null, null);
                }
            } catch (Exception e) {
                e.printStackTrace();
                throw new RestClientResponseException(e.getMessage(),(int)HttpStatus.NO_CONTENT.value(), HttpStatus.NO_CONTENT.toString(),httpResponse.getHeaders(),null,null);
            }
        } else if (httpResponse.getStatusCode()
                .series() == HttpStatus.Series.CLIENT_ERROR) {

            if(httpResponse.getRawStatusCode() == HttpStatus.UNAUTHORIZED.value())
            {
                throw new RestClientResponseException("Debe Colocar Usuario Racf Válido : "+httpResponse.getStatusText(),httpResponse.getRawStatusCode(), httpResponse.getStatusCode().toString(),httpResponse.getHeaders(),null,null);
            }else
            {
                throw new RestClientResponseException(httpResponse.getStatusText(),httpResponse.getRawStatusCode(), httpResponse.getStatusCode().toString(),httpResponse.getHeaders(),null,null);
            }
        }

    }
    public JSONObject  streamToString(final InputStream inputStream) throws Exception {
        try
        (
                final BufferedReader br
                        = new BufferedReader(new InputStreamReader(inputStream))
        ) {
            return  new JSONObject(br.lines().parallel().collect(Collectors.joining("\n")));
        } catch (final IOException e) {
            throw new RuntimeException(e);

        }
    }
}
