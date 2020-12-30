import { AxiosError, AxiosResponse } from 'axios';
import { DefaultResponse } from './models/DefaultResponse';
import * as Errors from './models/Errors';

/**
 * Handles general errors and all client request errors.
 * Client response errors are classified so that proper response error is generated.
 */
export class ErrorHandler {
  /**
   * Process callback function for HTTP request.
   *
   * @param error - request error that needs to be transformed to proper Oms error.
   *
   * @return {OmsError} - formatted Oms error
   */
  public buildRequestError(error: AxiosError): Errors.OmsError {
    const response: AxiosResponse | undefined = error.response;

    if (response !== undefined) {
      return this.buildErrorForResponse(response, error.message);
    } else if (error.message !== undefined) {
      return this.buildGeneralError(error.message);
    } else {
      return this.buildGeneralError(
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
    }
  }

  /**
   * Build general OMS error.
   *
   * @param errorMessage - error message that needs to be identified and transformed to proper OMS error.
   *
   * @returns properly formatted Oms error.
   */
  public buildGeneralError(errorMessage: string): Errors.OmsError {
    return new Errors.OmsError(errorMessage);
  }

  /**
   * Build Oms error based on response from http client.
   *
   * @param {AxiosResponse} response - request response used to transform to Oms error.
   * @return {OmsError} - formatted Oms error
   */
  private buildErrorForResponse(
    response: AxiosResponse,
    errorMessage: string
  ): Errors.OmsError {
    const data: DefaultResponse = response.data;
    const errorCode = this.retrieveDefaultOrValue<number>(0, data.ErrorCode);
    const status = this.retrieveDefaultOrValue<number>(0, response.status);
    const message = this.retrieveDefaultOrValue<string>(
      errorMessage,
      data.Message
    );

    return this.buildRequestErrorByStatus(message, errorCode, status);
  }

  private retrieveDefaultOrValue<T>(defaultValue: T, data: T): T {
    return data === undefined ? defaultValue : data;
  }

  /**
   * Build Oms error based on HTTP request status.
   *
   * @param error - http request library error, that will be transformed to Oms error.
   *
   * @returns properly formatted Oms error.
   */
  private buildRequestErrorByStatus(
    errorMessage: string,
    errorCode: number,
    errorStatusCode: number
  ): Errors.HttpError {
    switch (errorStatusCode) {
      case 401:
        return new Errors.InvalidAPIKeyError(
          errorMessage,
          errorCode,
          errorStatusCode
        );

      case 404:
        return new Errors.OmsError(errorMessage, errorCode, errorStatusCode);

      case 422:
        return new Errors.ApiInputError(
          errorMessage,
          errorCode,
          errorStatusCode
        );

      case 500:
        return new Errors.InternalServerError(
          errorMessage,
          errorCode,
          errorStatusCode
        );

      case 503:
        return new Errors.ServiceUnavailablerError(
          errorMessage,
          errorCode,
          errorStatusCode
        );

      default:
        return new Errors.UnknownError(
          errorMessage,
          errorCode,
          errorStatusCode
        );
    }
  }
}
