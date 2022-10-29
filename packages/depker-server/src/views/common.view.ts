export type SuccessResponse = {
  status: "success";
};

export type ErrorResponse = {
  statusCode: number;
  message: string | string[];
};
