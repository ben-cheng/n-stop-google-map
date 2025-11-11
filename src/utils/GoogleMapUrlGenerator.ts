const GoogleMapUrlGenerator = (stopsInput: string | Array<string>): string => {
  const baseUrl = "https://google.com/maps/dir/";

  const stopsList: string[] = Array.isArray(stopsInput)
    ? stopsInput
    : stopsInput.split("\n");

  const formattedStops = stopsList
    .map((stop) => stop.trim())
    .map((stop) => encodeURIComponent(stop).replace(/%20/g, "+"))
    .filter((stop) => stop.length > 0)
    .join("/");

  return formattedStops.length > 0 ? baseUrl + formattedStops : "";
}

export default GoogleMapUrlGenerator;