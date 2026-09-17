export class Person {
  id?: string; // Optional (auto-generated)
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthday: Date | null;
  phone?: string;
  address?: string;

  constructor(
    documentType: string,
    documentNumber: string,
    firstName: string,
    lastName: string,
    birthday: Date | null,
    id?: string,
    phone?: string,
    address?: string,
  ) {
    this.documentType = documentType;
    this.documentNumber = documentNumber;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthday = birthday;
    this.id = id;
    this.phone = phone;
    this.address = address;
  }
}
