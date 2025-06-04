import protobuf from "protobufjs"
import path from "path"
import * as pb from "../protos/upstox_pb"



export const decodeProtoBuf = async (buffer : Buffer) => {
    const FeedResponse = pb.com.upstox.marketdatafeeder.rpc.proto.FeedResponse;
    const message =  FeedResponse.decode(buffer);
    return FeedResponse.toObject(message);
}

    






