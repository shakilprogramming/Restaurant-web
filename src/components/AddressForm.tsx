"use client";

import { AddressElement } from "@stripe/react-stripe-js";

const AddressForm = () => (
  <AddressElement options={{ mode: "billing" }} />
);

export default AddressForm;
